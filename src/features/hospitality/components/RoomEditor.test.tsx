import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoomEditor } from "./RoomEditor";
import type { HospitalityRoom } from "../contracts";

const mocks = vi.hoisted(() => ({
  createCategory: vi.fn(),
  createRoom: vi.fn(),
  updateRoom: vi.fn(),
}));

let categories: Array<{
  id: string;
  name: string;
  description: string | null;
  places: Array<{ id: string; name: string }>;
}> = [];

vi.mock("../queries", () => ({
  roomCategoryKeys: { all: ["hospitality", "room-categories"] },
  hospitalityRoomKeys: { all: ["hospitality", "rooms"] },
  useRoomCategories: () => ({ data: categories, isPending: false }),
  useHospitalityAmenities: () => ({
    data: [
      {
        code: "wifi",
        label: "Wi-Fi",
        group: "connectivity",
        group_label: "Connectivity",
      },
      {
        code: "air_conditioning",
        label: "Air conditioning",
        group: "comfort",
        group_label: "Comfort",
      },
    ],
    isPending: false,
    isError: false,
  }),
}));

vi.mock("@/features/place-groups/api", () => ({
  placeGroupsApi: {
    create: mocks.createCategory,
    list: async () => [],
    update: async () => ({}),
  },
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: { selectedSite: { id: string } }) => unknown,
  ) => selector({ selectedSite: { id: "site-1" } }),
}));

vi.mock("../api", () => ({
  hospitalityApi: {
    rooms: {
      create: mocks.createRoom,
      update: mocks.updateRoom,
    },
  },
}));

const room: HospitalityRoom = {
  id: "room-1",
  name: "Room 101",
  room_number: "101",
  room_type: "suite",
  place_group_id: null,
  place_group_name: null,
  floor: null,
  capacity: 2,
  base_rate: "180.00",
  currency: "USD",
  amenities: ["wifi"],
  status: "available",
  housekeeping_status: "clean",
  current_stay_id: null,
  current_guest_name: null,
  next_arrival: null,
  maintenance_open: 0,
  updated_at: "2026-11-14T10:00:00Z",
};

function mount(existing: HospitalityRoom | null = null) {
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
      <RoomEditor
        open
        room={existing}
        canEdit
        onClose={vi.fn()}
        onSaved={vi.fn(async () => {})}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  categories = [];
  mocks.createCategory.mockReset();
  mocks.createRoom.mockReset();
  mocks.updateRoom.mockReset();
});

describe("room category in the editor", () => {
  it("offers to create the first category when there are none", () => {
    mount();

    expect(
      screen.getByText(/No categories yet — create the first one/),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /New category/ })).toBeTruthy();
  });

  it("creates a category from the drawer and selects it", async () => {
    mocks.createCategory.mockResolvedValue({
      id: "group-new",
      name: "Deluxe Super",
      description: null,
      places: [],
    });
    mount();

    fireEvent.click(screen.getByRole("button", { name: /New category/ }));
    fireEvent.change(await screen.findByLabelText("New category name"), {
      target: { value: "Deluxe Super" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create category" }));

    await waitFor(() => expect(mocks.createCategory).toHaveBeenCalledTimes(1));
    expect(mocks.createCategory).toHaveBeenCalledWith({
      site_id: "site-1",
      name: "Deluxe Super",
      description: null,
      // A category exists before the rooms that will be sold as it.
      place_ids: [],
    });
  });

  it("lists existing categories in the picker", () => {
    categories = [
      { id: "group-1", name: "Executive Suite", description: null, places: [] },
    ];
    mount();

    const select = screen.getByLabelText("Room category") as HTMLSelectElement;
    expect(
      within(select).getByRole("option", { name: "Executive Suite" }),
    ).toBeTruthy();
    // No "nothing here yet" prompt once categories exist.
    expect(screen.queryByText(/No categories yet/)).toBeNull();
  });
});

describe("room details", () => {
  it("hides live operational state until asked for", () => {
    mount(room);

    expect(screen.getByRole("button", { name: "View details" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Room details" })).toBeNull();
  });

  it("shows what the room is doing, not just what it is", () => {
    mount(room);

    fireEvent.click(screen.getByRole("button", { name: "View details" }));

    const panel = screen.getByRole("region", { name: "Room details" });
    expect(within(panel).getByText("Vacant")).toBeTruthy();
    expect(within(panel).getByText("None booked")).toBeTruthy();
    // Amenity codes are shown as the vocabulary's labels.
    expect(within(panel).getByText("Wi-Fi")).toBeTruthy();
  });

  it("offers no details toggle before the room exists", () => {
    mount();

    expect(screen.queryByRole("button", { name: "View details" })).toBeNull();
  });
});
