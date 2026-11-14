import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoomsPage from "./page";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setStatus: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/features/hospitality/use-hospitality-access", () => ({
  useHospitalityAccess: () => ({
    contextKey: "org:user",
    organization: { id: "org" },
    isLoading: false,
    allowed: () => true,
    profile: { isError: false, refetch: mocks.refetch },
  }),
}));

vi.mock("@/features/hospitality/api", () => ({
  hospitalityApi: {
    rooms: {
      list: mocks.list,
      create: mocks.create,
      update: mocks.update,
      setStatus: mocks.setStatus,
    },
    amenities: { list: async () => [] },
  },
}));

// The category picker reads Place groups. Left unmocked it would try a real
// fetch, so the suite pins a fixed vocabulary instead.
vi.mock("@/features/place-groups/api", () => ({
  placeGroupsApi: {
    list: async () => [
      { id: "group-deluxe", name: "Deluxe Super", description: null, places: [] },
    ],
    create: async () => ({}),
    update: async () => ({}),
  },
}));

const room = {
  id: "room-1",
  name: "Harbour Suite",
  room_number: "101",
  room_type: "suite",
  place_group_id: null,
  place_group_name: null,
  floor: "1",
  capacity: 2,
  base_rate: "180.00",
  currency: "USD",
  status: "available",
  housekeeping_status: "clean",
  current_stay_id: null,
  current_guest_name: null,
  next_arrival: null,
  maintenance_open: 0,
  updated_at: "2026-11-09T10:00:00Z",
} as const;

function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <RoomsPage />
    </QueryClientProvider>,
  );
}

describe("hospitality room inventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue([room]);
  });

  it("renders real inventory and exposes bounded room creation", async () => {
    mount();

    expect(
      await screen.findByRole("heading", { name: "Room inventory" }),
    ).toBeInTheDocument();
    expect((await screen.findAllByText("Harbour Suite")).length).toBeGreaterThan(
      0,
    );
    expect((await screen.findAllByText("$180.00")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Add room" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Room name")).toBeInTheDocument();
    expect(screen.getByLabelText("Sleeps")).toBeInTheDocument();
  });

  it("renders an explicit recoverable collection failure", async () => {
    mocks.list.mockRejectedValueOnce(new Error("inventory unavailable"));
    mount();

    expect(await screen.findByText("inventory unavailable")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Retry" }).length,
    ).toBeGreaterThan(0);
  });

  it("creates the room the operator typed, sold as the category they chose", async () => {
    // The form opened and rendered but never reached the API, so this asserts the
    // call itself rather than only that the fields are on screen.
    mocks.create.mockResolvedValue(room);
    mount();

    fireEvent.click(await screen.findByRole("button", { name: "Add room" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Room name"), {
      target: { value: "Harbour Twin" },
    });
    fireEvent.change(within(dialog).getByLabelText("Room number"), {
      target: { value: "102" },
    });
    fireEvent.change(within(dialog).getByLabelText("Room category"), {
      target: { value: "group-deluxe" },
    });
    fireEvent.change(within(dialog).getByLabelText("Nightly rate"), {
      target: { value: "95" },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "Add room" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Harbour Twin",
        room_number: "102",
        // The category, not a retyped type string: the server derives
        // `room_type` from it so the two cannot disagree.
        place_group_id: "group-deluxe",
        base_rate: "95.00",
        currency: "USD",
      }),
    );
  });

  it("does not demand a category before a room can be entered", async () => {
    // A room can exist before anyone decides what to sell it as, and the floor
    // is optional because plenty of properties have only one.
    mocks.create.mockResolvedValue(room);
    mount();

    fireEvent.click(await screen.findByRole("button", { name: "Add room" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Room name"), {
      target: { value: "Store room" },
    });
    fireEvent.change(within(dialog).getByLabelText("Room number"), {
      target: { value: "B1" },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "Add room" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ place_group_id: null, floor: null }),
    );
  });
});
