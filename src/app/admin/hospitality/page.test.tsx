import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, it, expect, beforeEach } from "vitest";
import Page from "./page";
const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  action: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  people: vi.fn(),
  context: vi.fn(),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (select: any) =>
    select({
      organization: { id: "org" },
      selectedProperty: { id: "hotel", name: "Harbour Hotel" },
    }),
}));
vi.mock("@/store/auth-store", () => ({
  useAuthStore: (select: any) => select({ user: { id: "user" } }),
}));
vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
}));
vi.mock("@/features/hospitality/api", () => ({ hospitalityApi: mocks }));
vi.mock("@/features/hospitality/people-api", () => ({
  hospitalityPeopleApi: { list: mocks.people },
}));
vi.mock("@/features/context/api", () => ({
  contextApi: { workspace: mocks.context },
}));
vi.mock("@/components/facets/FacetPicker", () => ({ FacetPicker: () => null }));
const stay = {
  id: "stay",
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
      <Page />
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
          party_id: "admin-party",
          display_name: "Dana Admin",
          email: "dana@example.test",
          role: "site_admin",
        },
      ],
    },
  });
  mocks.people.mockResolvedValue({
    items: [
      {
        id: "guest-link",
        organization_id: "org",
        role: "guest_of",
        status: "active",
        effective_from: null,
        effective_to: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
        party: {
          id: "guest-party",
          kind: "person",
          display_name: "Gina Guest",
          email: "gina@example.test",
          is_active: true,
        },
        place: {
          id: "room",
          name: "Suite 12",
          slug: "suite-12",
          kind: "room",
          is_active: true,
        },
      },
    ],
    page: 1,
    total: 2,
    total_pages: 1,
  });
});
it("shows site administrators, occupants and the live arrival queue", async () => {
  mount();
  await screen.findByRole("heading", { name: "Hotel operations" });
  expect(
    await screen.findByText("Administration and occupancy"),
  ).toBeInTheDocument();
  expect(screen.getByText("Dana Admin")).toBeInTheDocument();
  expect(mocks.context).toHaveBeenCalledWith("hotel");
  expect(screen.getByText("Gina Guest")).toBeInTheDocument();
  expect(screen.getAllByText("Expected arrivals").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Ada Guest").length).toBeGreaterThan(0);
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
          party_id: "parent-admin",
          display_name: "Morgan Manager",
          email: "morgan@example.test",
          role: "site_admin",
        },
      ],
    },
  });
  mount();

  expect(
    await screen.findByText("Administration is inherited from Harbour Group."),
  ).toBeInTheDocument();
  expect(screen.getByText("Morgan Manager")).toBeInTheDocument();
});
it("renders empty and failed lists explicitly with retry", async () => {
  mocks.list.mockRejectedValueOnce(new Error("unavailable"));
  mount();
  await screen.findByRole("button", { name: "Retry" });
  mocks.list.mockResolvedValue({
    items: [],
    page: 1,
    total: 0,
    total_pages: 0,
  });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(
    (await screen.findAllByText("No reservations yet")).length,
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
    expect(mocks.action).toHaveBeenCalledWith("stay", "check-in", undefined),
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
