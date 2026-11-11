import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { PlaceWorkspacePage } from "@/features/place-workspace/PlaceWorkspacePage";
const m = vi.hoisted(() => ({
  context: {} as any,
  announcements: vi.fn(),
  maintenance: vi.fn(),
  request: vi.fn(),
  members: vi.fn(),
  charges: vi.fn(),
  chargeDefinitions: vi.fn(),
  acknowledge: vi.fn(),
  movements: vi.fn(),
  invitations: vi.fn(),
}));
vi.mock("@/features/place-workspace/PlaceWorkspaceShell", () => ({
  usePlaceWorkspace: () => m.context,
}));
vi.mock("@/features/place-workspace/api", () => ({
  placeWorkspaceApi: {
    announcements: m.announcements,
    maintenance: m.maintenance,
    requestMaintenance: m.request,
    members: m.members,
    charges: m.charges,
    chargeDefinitions: m.chargeDefinitions,
    acknowledgeCharge: m.acknowledge,
    movements: m.movements,
  },
}));
vi.mock("@/features/access-journey/AccessWorkspace", () => ({
  AccessWorkspace: () => <section>Invitation tools</section>,
}));
vi.mock("@/features/access-journey/api", () => ({
  accessJourneyApi: { list: m.invitations, cancel: vi.fn() },
}));
vi.mock("@/features/profile/ProfilePage", () => ({
  ProfilePage: ({ audience }: { audience: string }) => (
    <section>Shared profile ({audience})</section>
  ),
}));
vi.mock("@/features/guest-stay/GuestStayDashboard", () => ({
  GuestStayDashboard: () => <section>Stay details</section>,
}));
vi.mock("@/hooks/use-auth", () => ({
  useVerifyToken: () => ({
    data: { user: { name: "Resident", email: "resident@example.test" } },
  }),
}));
beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.clear();
  m.context = {
    place: { id: "unit", name: "APT 01", kind: "unit", is_active: true },
    party: {
      id: "party",
      display_name: "Resident",
      email: "resident@example.test",
    },
    relationships: [
      {
        id: "rel",
        role: "resident",
        place: { id: "unit" },
        party: { id: "party" },
      },
    ],
    is_place_admin: false,
    effective_use_case: "residential",
    modules: [
      "access_control",
      "maintenance",
      "communication",
      "billing",
      "people",
    ],
    maintenance_categories: ["plumbing", "other"],
  };
  m.announcements.mockResolvedValue([]);
  m.maintenance.mockResolvedValue({ items: [], total: 0 });
  m.charges.mockResolvedValue({ items: [], total: 0 });
  m.chargeDefinitions.mockResolvedValue({ items: [], total: 0 });
  m.members.mockResolvedValue([]);
  m.movements.mockResolvedValue({ items: [], has_more: false });
  m.invitations.mockResolvedValue({ items: [], total: 0 });
  m.request.mockResolvedValue({ id: "request" });
});
function mount(section: string) {
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
      <PlaceWorkspacePage section={section} />
    </QueryClientProvider>,
  );
}
it("renders the configured resident dashboard with live empty states", async () => {
  mount("overview");
  expect((await screen.findAllByText("APT 01")).length).toBeGreaterThan(0);
  expect(await screen.findByText("Nothing outstanding")).toBeVisible();
  expect(screen.getByText("Upcoming visits")).toBeVisible();
  expect(m.members).not.toHaveBeenCalled();
});
it("lists only visits that are still upcoming and not yet active", async () => {
  const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
  const past = new Date(Date.now() - 3_600_000).toISOString();
  const base = {
    code: "INV-000001",
    qr_code_url: null,
    valid_from: future,
    valid_to: future,
    max_uses: 1,
    uses_count: 0,
    purpose: null,
    additional_information: null,
    decline_reason: null,
    requested_at: past,
    decided_at: null,
    host_party: { display_name: "Resident" },
    destination_place: { id: "unit", name: "APT 01", kind: "unit", address: "" },
  };
  m.invitations.mockResolvedValue({
    items: [
      {
        ...base,
        id: "active",
        status: "approved",
        display_status: "active",
        guests: [
          {
            id: "g-active",
            display_name_snapshot: "Active Visitor",
            suffix: "001",
          },
        ],
      },
      {
        ...base,
        id: "upcoming",
        status: "approved",
        display_status: "approved",
        guests: [
          {
            id: "g-upcoming",
            display_name_snapshot: "Upcoming Visitor",
            suffix: "002",
          },
        ],
      },
      {
        ...base,
        id: "requested",
        status: "requested",
        display_status: "requested",
        guests: [
          {
            id: "g-requested",
            display_name_snapshot: "Requested Visitor",
            suffix: "003",
          },
        ],
      },
    ],
    total: 3,
  });

  mount("overview");

  const card = (await screen.findByText("Upcoming visits")).closest("section");
  expect(card).not.toBeNull();
  expect(
    await within(card as HTMLElement).findByText("Upcoming Visitor"),
  ).toBeVisible();
  expect(within(card as HTMLElement).getByText("Requested Visitor")).toBeVisible();
  expect(
    within(card as HTMLElement).getAllByText(/in \d+ days/),
  ).toHaveLength(2);
  expect(within(card as HTMLElement).queryByText("Active Visitor")).toBeNull();
});

it("shows announcements as priority alerts above the dashboard", async () => {
  m.announcements.mockResolvedValue([
    {
      id: "announcement-1",
      title: "Water supply maintenance",
      body: "Water will be unavailable between 10:00 and 12:00.",
      priority: "urgent",
      published_at: "2026-11-18T09:00:00Z",
      is_pinned: false,
    },
    {
      id: "announcement-2",
      title: "New gym hours",
      body: "The gym now opens at 05:00.",
      priority: "normal",
      published_at: "2026-11-17T09:00:00Z",
      is_pinned: false,
    },
  ]);

  mount("overview");
  expect(await screen.findByText("Water supply maintenance")).toBeVisible();
  expect(screen.getByText("Urgent")).toBeVisible();
  expect(screen.getByText("Notice")).toBeVisible();
  const more = screen.getAllByRole("link", { name: /View more/ });
  expect(more[0]).toHaveAttribute("href", "/workspace/unit/announcements");
  // Highest severity is stacked first.
  const alerts = screen.getAllByRole("listitem");
  const urgentRow = alerts.find(
    (item) => item.querySelector('[data-priority="urgent"]') !== null,
  );
  expect(urgentRow).toBeDefined();
  expect(alerts[0]).toContainElement(
    urgentRow!.querySelector('[data-priority="urgent"]') as HTMLElement,
  );
  // Foreground card is widest and on top; the next layer is narrower and
  // tucked underneath with a small offset.
  expect((alerts[0] as HTMLElement).style.width).toBe("100%");
  expect((alerts[0] as HTMLElement).style.marginTop).toBe("");
  expect((alerts[1] as HTMLElement).style.width).toBe("calc(100% - 20px)");
  expect(parseFloat((alerts[1] as HTMLElement).style.marginTop)).toBeLessThan(0);
  expect((alerts[1] as HTMLElement).style.transform).toBe("translateY(2px)");
  expect(Number((alerts[0] as HTMLElement).style.zIndex)).toBeGreaterThan(
    Number((alerts[1] as HTMLElement).style.zIndex),
  );
});

it("renders a single announcement without layering", async () => {
  m.announcements.mockResolvedValue([
    {
      id: "announcement-single",
      title: "Lift service",
      body: "The lift will be serviced on Friday.",
      priority: "high",
      published_at: "2026-11-18T09:00:00Z",
      is_pinned: false,
    },
  ]);

  mount("overview");
  const item = await screen.findByText("Lift service");
  const row = item.closest("li") as HTMLElement;
  expect(row.style.width).toBe("100%");
  expect(row.style.marginTop).toBe("");
  expect(row.style.transform).toBe("");
});

it("keeps a dismissed announcement off the dashboard after a reload", async () => {
  m.announcements.mockResolvedValue([
    {
      id: "announcement-dismiss",
      title: "Water shutdown",
      body: "Water off between 10:00 and 12:00.",
      priority: "urgent",
      published_at: "2026-11-18T09:00:00Z",
      is_pinned: false,
    },
  ]);

  const view = mount("overview");
  fireEvent.click(
    await screen.findByRole("button", { name: "Dismiss Water shutdown" }),
  );
  await waitFor(() =>
    expect(screen.queryByText("Water shutdown")).not.toBeInTheDocument(),
  );
  expect(
    JSON.parse(
      window.localStorage.getItem("vms.announcements.dismissed.party.unit") ??
        "[]",
    ),
  ).toContain("announcement-dismiss");

  view.unmount();
  mount("overview");
  expect(await screen.findByText("Upcoming visits")).toBeVisible();
  expect(screen.queryByText("Water shutdown")).not.toBeInTheDocument();
});

it("denies direct settings navigation for an ordinary resident", () => {
  mount("settings");
  expect(screen.getByText("Page unavailable")).toBeVisible();
  expect(m.members).not.toHaveBeenCalled();
});

it("renders invitations through the Party workspace tools", () => {
  mount("invitations");
  expect(screen.getByText("Invitation tools")).toBeVisible();
});
it("submits a maintenance request for the current Place", async () => {
  mount("maintenance");
  fireEvent.click(screen.getByRole("button", { name: /Report an issue/ }));
  fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), {
    target: { value: "Kitchen leak" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: /Describe the issue/ }),
    { target: { value: "The kitchen tap is leaking continuously." } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
  await waitFor(() =>
    expect(m.request).toHaveBeenCalledWith(
      "unit",
      expect.objectContaining({ title: "Kitchen leak", category: "plumbing" }),
    ),
  );
});
it("opens a maintenance request in a drawer below xl", async () => {
  m.maintenance.mockResolvedValue({
    items: [
      {
        id: "request-1",
        title: "Kitchen tap leaking",
        description: "Water pools under the sink cabinet.",
        category: "plumbing",
        priority: "high",
        status: "assigned",
        created_at: "2026-11-01T09:00:00Z",
      },
    ],
    total: 1,
  });

  mount("maintenance");
  fireEvent.click(
    await screen.findByRole("button", { name: "Kitchen tap leaking" }),
  );

  const drawer = await screen.findByRole("dialog", {
    name: "Maintenance request",
  });
  expect(
    within(drawer).getByText("Water pools under the sink cabinet."),
  ).toBeVisible();
  expect(
    within(drawer).getByText(/Current status · Assigned/),
  ).toBeVisible();
});
it("renders visitors, movements, charges, announcements and profile sections", async () => {
  mount("visitors");
  expect(
    (await screen.findAllByText(/No visitors to show|Visitors on your invitations/))
      .length,
  ).toBeGreaterThan(0);
});

it("renders the movement log with audience controls", async () => {
  mount("movements");
  expect(
    await screen.findByRole("button", { name: "My visitors" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "My access" })).toBeInTheDocument();
  expect(await screen.findByText("No movement recorded")).toBeVisible();
});

it("lists charge definitions before opening the schedule ledger", async () => {
  m.chargeDefinitions.mockResolvedValue({
    items: [
      {
        definition_id: "definition",
        title: "Service charge",
        recurrence: "quarterly",
        is_recurring: true,
        is_flexible: false,
        amount: "100000.00",
        currency: "NGN",
        schedule_count: 4,
        open_count: 1,
        outstanding: "100000.00",
        paid: 0,
        next_due_date: "2026-11-20T00:00:00Z",
        last_due_date: "2027-08-20T00:00:00Z",
        can_pay: true,
        acknowledged_cadence: null,
        status: "outstanding",
      },
    ],
    total: 1,
  });
  m.charges.mockResolvedValue({
    items: [
      {
        id: "schedule",
        title: "Service charge",
        definition_id: "definition",
        due_date: "2026-11-20T00:00:00Z",
        amount: "100000.00",
        balance: "100000.00",
        currency: "NGN",
        status: "scheduled",
        can_pay: true,
        assignment_id: "assignment",
        recurrence: "quarterly",
        is_recurring: true,
        is_flexible: false,
        acknowledged_cadence: null,
      },
    ],
    total: 1,
  });

  mount("charges");

  expect(await screen.findByText("Outstanding balance")).toBeVisible();
  expect(await screen.findByText("1 open / 4")).toBeVisible();
  expect(m.charges).not.toHaveBeenCalled();

  fireEvent.click(
    await screen.findByRole("button", { name: "Service charge" }),
  );

  await waitFor(() =>
    expect(m.charges).toHaveBeenCalledWith("unit", 1, "definition"),
  );
  expect(await screen.findByRole("button", { name: "All charges" })).toBeVisible();
  expect(await screen.findByText("Next due")).toBeVisible();
  expect(
    screen.getAllByRole("button", { name: /^Pay/ }).length,
  ).toBeGreaterThan(0);
});

it("shows next payment details and acknowledges a flexible frequency", async () => {
  m.acknowledge.mockResolvedValue({
    id: "ack",
    charge_assignment_id: "assignment",
    party_id: "party",
    cadence: "quarterly",
    baseline_cadence: "monthly",
    note: null,
    acknowledged_at: "2026-11-10T10:00:00Z",
  });
  m.chargeDefinitions.mockResolvedValue({
    items: [
      {
        definition_id: "definition",
        title: "Service charge",
        recurrence: "monthly",
        is_recurring: true,
        is_flexible: true,
        amount: "15000.00",
        currency: "NGN",
        schedule_count: 1,
        open_count: 1,
        outstanding: "15000.00",
        paid: 0,
        next_due_date: "2026-12-01T00:00:00Z",
        last_due_date: "2026-12-01T00:00:00Z",
        can_pay: true,
        acknowledged_cadence: null,
        status: "outstanding",
      },
    ],
    total: 1,
  });
  m.charges.mockResolvedValue({
    items: [
      {
        id: "schedule",
        title: "Service charge",
        due_date: "2026-12-01T00:00:00Z",
        amount: "15000.00",
        balance: "15000.00",
        currency: "NGN",
        status: "scheduled",
        can_pay: true,
        assignment_id: "assignment",
        recurrence: "monthly",
        is_recurring: true,
        is_flexible: true,
        acknowledged_cadence: null,
      },
    ],
    total: 1,
  });

  mount("charges");
  fireEvent.click(
    await screen.findByRole("button", { name: "Service charge" }),
  );

  expect(await screen.findByText(/Next payment/)).toBeVisible();
  expect(await screen.findByText(/not acknowledged yet/i)).toBeVisible();
  expect(await screen.findByText(/frequency not acknowledged/i)).toBeVisible();
  expect(screen.getAllByText(/Monthly/).length).toBeGreaterThan(0);

  fireEvent.click(
    screen.getByRole("button", { name: "Acknowledge frequency" }),
  );
  const modal = await screen.findByRole("dialog", {
    name: "Acknowledge this fee",
  });
  fireEvent.change(within(modal).getByLabelText(/How often will you pay/), {
    target: { value: "quarterly" },
  });
  fireEvent.click(
    within(modal).getByRole("button", { name: /Acknowledge Quarterly/ }),
  );

  await waitFor(() =>
    expect(m.acknowledge).toHaveBeenCalledWith("unit", "assignment", {
      cadence: "quarterly",
      note: null,
    }),
  );
});

it("renders published announcements", async () => {
  m.announcements.mockResolvedValue([
    {
      id: "announcement",
      title: "Water supply maintenance",
      body: "Water will be unavailable between 10:00 and 12:00.",
      published_at: "2026-11-18T09:00:00Z",
      is_pinned: true,
    },
  ]);
  mount("announcements");
  expect(
    (await screen.findAllByText("Water supply maintenance")).length,
  ).toBeGreaterThan(0);
  expect(
    screen.getByRole("textbox", { name: "Search announcements" }),
  ).toBeInTheDocument();
});

it("renders the shared profile inside the workspace shell", async () => {
  mount("profile");
  expect(await screen.findByText("Shared profile (resident)")).toBeVisible();
});

it("shows Place settings to a Place administrator", async () => {
  m.context.is_place_admin = true;
  mount("settings");
  expect(
    await screen.findByRole("button", { name: "Add household member" }),
  ).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Notification preferences" }),
  ).toBeVisible();
  await waitFor(() => expect(m.members).toHaveBeenCalledWith("unit"));
});

it("edits notification preferences and offers an explicit save", async () => {
  m.context.is_place_admin = true;
  mount("settings");

  const tabs = await screen.findByRole("navigation", {
    name: "Place settings sections",
  });
  expect(
    within(tabs).getByRole("button", { name: "Notifications" }),
  ).toBeVisible();
  expect(
    within(tabs).getByRole("button", { name: "Household access" }),
  ).toBeVisible();

  const arrival = await screen.findByRole("switch", {
    name: "New visitor arrival alert",
  });
  expect(arrival).toHaveAttribute("aria-checked", "true");
  expect(screen.queryByText("Unsaved changes")).toBeNull();

  fireEvent.click(arrival);

  expect(arrival).toHaveAttribute("aria-checked", "false");
  expect(await screen.findByText("Unsaved changes")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(screen.queryByText("Unsaved changes")).toBeNull());
});
