import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, it, expect, beforeEach } from "vitest";
import { TooltipProvider } from "@/components/ui/Tooltip";
import Page from "./HospitalityOverview";
const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  action: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  rooms: { list: vi.fn() },
  context: vi.fn(),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (select: any) =>
    select({
      organization: { id: "org" },
      selectedSite: { id: "hotel", name: "Harbour Hotel" },
    }),
}));
vi.mock("@/store/auth-store", () => ({
  useAuthStore: (select: any) => select({ user: { id: "user" } }),
}));
vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
}));
vi.mock("@/features/hospitality/api", () => ({ hospitalityApi: mocks }));
vi.mock("@/features/context/api", () => ({
  contextApi: { workspace: mocks.context },
}));
vi.mock("@/components/facets/FacetPicker", () => ({ FacetPicker: () => null }));
const stay = {
  id: "stay",
  site_id: "site-1",
  status: "reserved",
  planned_check_in: "2027-01-02T15:00:00Z",
  planned_check_out: "2027-01-04T11:00:00Z",
  actual_check_in: null,
  actual_check_out: null,
  notes: null,
  guests: [
    { id: "g", role: "primary", party: { id: "p", display_name: "Ada Guest" } },
  ],
  room_assignments: [
    {
      id: "r",
      assigned_from: "2027-01-02T15:00:00Z",
      assigned_to: "2027-01-04T11:00:00Z",
      room: { id: "room", name: "Suite 12" },
    },
  ],
};
const room = {
  id: "room",
  name: "Suite 12",
  room_number: "12",
  room_type: "suite",
  place_group_id: null,
  place_group_name: null,
  floor: "1",
  capacity: 2,
  base_rate: "12000",
  currency: "NGN",
  amenities: [],
  status: "available",
  housekeeping_status: "clean",
  current_stay_id: null,
  current_guest_name: null,
  next_arrival: null,
  next_guest_name: null,
  maintenance_open: 0,
  updated_at: "2027-01-01T00:00:00Z",
};
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
      <TooltipProvider>
        <Page />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.profile.mockResolvedValue({ data: { effective_permissions: ["*"] } });
  mocks.list.mockResolvedValue({
    items: [stay],
    page: 1,
    total: 1,
    total_pages: 1,
  });
  mocks.get.mockResolvedValue(stay);
  mocks.rooms.list.mockResolvedValue([
    room,
    {
      ...room,
      id: "room-2",
      name: "Room 14",
      room_number: "14",
      housekeeping_status: "dirty",
    },
  ]);
  mocks.context.mockResolvedValue({
    management: {
      mode: "local",
      management_required: true,
      is_administrator: true,
      site_admin_id: "site-admin",
      selected_site: {
        id: "hotel",
        name: "Harbour Hotel",
        slug: "harbour-hotel",
        use_case: "hospitality",
        parent_site_id: null,
      },
      authoritative_site: {
        id: "hotel",
        name: "Harbour Hotel",
        slug: "harbour-hotel",
        use_case: "hospitality",
        parent_site_id: null,
      },
      administrators: [
        {
          site_admin_id: "site-admin",
          user_id: "admin-user",
          display_name: "Dana Admin",
          email: "dana@example.test",
          role: "site_admin",
        },
      ],
    },
  });
});
it("prioritizes stays and room readiness over generic administration", async () => {
  mount();
  await screen.findByRole("heading", { name: "Hotel operations" });
  expect(
    await screen.findByText(
      "The next arrivals in the loaded reservation queue.",
    ),
  ).toBeInTheDocument();
  expect(mocks.context).toHaveBeenCalledWith("hotel");
  expect(mocks.list).toHaveBeenCalledWith(1, "checked_in");
  expect(mocks.rooms.list).toHaveBeenCalled();
  expect(screen.getByText("Checked in")).toBeInTheDocument();
  const summary = screen.getByRole("region", {
    name: "Hospitality operating summary",
  });
  expect(within(summary).getByText("Ready rooms")).toBeInTheDocument();
  expect(within(summary).getByText("Rooms needing work")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Reserved stays" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Room readiness" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("Needs cleaning")).toBeInTheDocument();
  expect(screen.getAllByText("Ada Guest").length).toBeGreaterThan(0);
  expect(screen.queryByText("Administration and occupancy")).toBeNull();
});
it("shows inherited site administration provenance", async () => {
  mocks.context.mockResolvedValue({
    management: {
      mode: "inherited",
      management_required: false,
      is_administrator: true,
      site_admin_id: "parent-site-admin",
      selected_site: {
        id: "hotel",
        name: "Harbour Hotel",
        slug: "harbour-hotel",
        use_case: "hospitality",
        parent_site_id: "parent",
      },
      authoritative_site: {
        id: "parent",
        name: "Harbour Group",
        slug: "harbour-group",
        use_case: "mixed_use",
        parent_site_id: null,
      },
      administrators: [
        {
          site_admin_id: "parent-site-admin",
          user_id: "parent-user",
          display_name: "Morgan Manager",
          email: "morgan@example.test",
          role: "site_admin",
        },
      ],
    },
  });
  mount();

  expect(
    await screen.findByText("Site management is inherited from Harbour Group."),
  ).toBeInTheDocument();
});
it("keeps stays visible when room inventory fails and supports retry", async () => {
  mocks.rooms.list.mockRejectedValueOnce(new Error("rooms unavailable"));
  mount();

  expect(
    await screen.findByRole("heading", { name: "Reserved stays" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByText("Room readiness is unavailable"),
  ).toBeInTheDocument();
  expect(screen.getAllByText("Ada Guest").length).toBeGreaterThan(0);

  fireEvent.click(
    within(screen.getByRole("region", { name: "Room readiness" })).getByRole(
      "button",
      { name: "Retry" },
    ),
  );
  expect(await screen.findByText("Needs cleaning")).toBeInTheDocument();
});
it("renders empty and failed lists explicitly with retry", async () => {
  mocks.list.mockImplementation((_: number, status: string) =>
    status === "reserved"
      ? Promise.reject(new Error("unavailable"))
      : Promise.resolve({ items: [stay], page: 1, total: 1, total_pages: 1 }),
  );
  mount();
  await screen.findByRole("button", { name: "Retry" });
  mocks.list.mockImplementation((_: number, status: string) =>
    Promise.resolve({
      items: status === "reserved" ? [] : [stay],
      page: 1,
      total: status === "reserved" ? 0 : 1,
      total_pages: status === "reserved" ? 0 : 1,
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(
    (
      await screen.findAllByText(
        "No reserved stays are waiting for arrival review.",
      )
    ).length,
  ).toBeGreaterThan(0);
});
it("hides lifecycle actions from read-only operators", async () => {
  mocks.profile.mockResolvedValue({
    data: {
      effective_permissions: [
        "hospitality_stays.list",
        "hospitality_stays.show",
      ],
    },
  });
  mount();
  fireEvent.click(
    (await screen.findAllByRole("button", { name: /Ada Guest/ }))[0],
  );
  await screen.findByRole("heading", { name: "Ada Guest" });
  expect(screen.queryByRole("button", { name: "Check in" })).toBeNull();
  expect(screen.queryByRole("button", { name: "New reservation" })).toBeNull();
});
it("requires confirmation and refreshes state after check-in", async () => {
  mocks.action.mockResolvedValue({ ...stay, status: "checked_in" });
  mocks.get
    .mockResolvedValueOnce(stay)
    .mockResolvedValue({ ...stay, status: "checked_in" });
  mount();
  fireEvent.click(
    (await screen.findAllByRole("button", { name: /Ada Guest/ }))[0],
  );
  fireEvent.click(await screen.findByRole("button", { name: "Check in" }));
  expect(mocks.action).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm action" }));
  await waitFor(() =>
    expect(mocks.action).toHaveBeenCalledWith("stay", "check-in"),
  );
  await screen.findByRole("button", { name: "Check out" });
});
it("preserves the editor and surfaces a conflict for retry", async () => {
  mocks.update.mockRejectedValue({
    isAxiosError: true,
    response: { data: { message: "Room overlaps another stay" } },
  });
  mount();
  fireEvent.click(
    (await screen.findAllByRole("button", { name: /Ada Guest/ }))[0],
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Reschedule / edit" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Save dates and notes" }));
  await screen.findByText("Room overlaps another stay");
  expect(screen.getByLabelText("Planned arrival")).toBeInTheDocument();
});

it("uses canonical checkin grants for a scoped operator", async () => {
  mocks.profile.mockResolvedValue({
    data: {
      effective_permissions: [
        "hospitality_stays.list",
        "hospitality_stays.show",
        "hospitality_stays.checkin",
      ],
    },
  });
  mount();
  fireEvent.click(
    (await screen.findAllByRole("button", { name: /Ada Guest/ }))[0],
  );
  expect(await screen.findByRole("button", { name: "Check in" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Reschedule / edit" }),
  ).toBeNull();
});
