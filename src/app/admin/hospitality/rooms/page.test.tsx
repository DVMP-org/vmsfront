import { fireEvent, render, screen } from "@testing-library/react";
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
  },
}));

const room = {
  id: "room-1",
  name: "Harbour Suite",
  room_number: "101",
  room_type: "suite",
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
    expect(screen.getByLabelText("Capacity")).toBeInTheDocument();
  });

  it("renders an explicit recoverable collection failure", async () => {
    mocks.list.mockRejectedValueOnce(new Error("inventory unavailable"));
    mount();

    expect(await screen.findByText("inventory unavailable")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Retry" }).length,
    ).toBeGreaterThan(0);
  });
});
