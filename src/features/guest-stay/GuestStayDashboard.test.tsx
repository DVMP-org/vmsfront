import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { guestStayApi } from "./api";
import { GuestStayDashboard } from "./GuestStayDashboard";

vi.mock("./api", () => ({
  guestStayApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <GuestStayDashboard />
    </QueryClientProvider>,
  );
}

const stay = {
  id: "stay",
  status: "reserved" as const,
  planned_check_in: "2027-04-05T15:00:00Z",
  planned_check_out: "2027-04-08T11:00:00Z",
  actual_check_in: null,
  actual_check_out: null,
  notes: null,
  guests: [
    {
      id: "guest",
      role: "primary",
      party: { id: "party", display_name: "Ada Guest" },
    },
  ],
  room_assignments: [
    {
      id: "assignment",
      assigned_from: "2020-01-01T00:00:00Z",
      assigned_to: null,
      room: { id: "room", name: "Suite 402" },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(guestStayApi.list).mockResolvedValue({
    items: [stay],
    total: 1,
    page: 1,
    page_size: 20,
    total_pages: 1,
  });
});

it("shows the guest stay, arrival state and assigned room", async () => {
  mount();

  expect(await screen.findByText("Arrival scheduled")).toBeInTheDocument();
  expect(screen.getByText("Suite 402")).toBeInTheDocument();
  expect(screen.getByText("Ada Guest")).toBeInTheDocument();
  expect(
    screen.getByText("Check in at the hotel reception"),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /room assignment/i }),
  ).not.toBeInTheDocument();
});

it("shows a guest-specific empty state", async () => {
  vi.mocked(guestStayApi.list).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 0,
  });
  mount();

  expect(await screen.findByText("No stay assigned")).toBeInTheDocument();
});
