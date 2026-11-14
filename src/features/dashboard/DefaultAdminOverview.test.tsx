import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "./DefaultAdminOverview";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  analyticsQuery: vi.fn(),
  attentionQuery: vi.fn(),
  refetch: vi.fn(),
  analyticsRefetch: vi.fn(),
  attentionRefetch: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  selectedSite: { id: "place", name: "Harbour Hotel" } as {
    id: string;
    name: string;
  } | null,
  managementIsAdministrator: true,
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminDashboard: mocks.query,
  useAdminAnalyticsSummary: mocks.analyticsQuery,
  useOperationsAttention: mocks.attentionQuery,
}));
vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => ({
    data: {
      effective_use_case: "mixed_use",
      management: { is_administrator: mocks.managementIsAdministrator },
    },
    isPending: false,
  }),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({ selectedSite: mocks.selectedSite }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

const dashboard = {
  metrics: {
    total_places: 4,
    total_parties: 3,
    active_relationships: 3,
    active_visit_authorizations: 2,
    pending_visit_authorizations: 1,
    active_visit_sessions: 1,
    active_checkpoint_presences: 1,
    checkpoint_events_today: 5,
  },
  root_places: [
    {
      id: "place",
      name: "Harbour Hotel",
      kind: "building",
      address: "2 Harbour Way",
      is_active: true,
      use_case: "hospitality",
    },
  ],
  recent_visit_authorizations: [
    {
      id: "visit",
      code: "VISIT01",
      status: "requested",
      purpose: "Guest arrival",
      valid_from: "2026-01-01",
      valid_to: "2026-01-02",
      uses_count: 0,
      max_uses: 1,
      host_party: { display_name: "Alex Host" },
      destination_place: { name: "Harbour Hotel" },
    },
  ],
  recent_checkpoint_events: [
    {
      id: "event",
      direction: "entry",
      outcome: "allowed",
      reason_code: "authorization_valid",
      occurred_at: "2026-01-01T10:00:00Z",
      place_id: "place",
      gate_id: "gate",
    },
  ],
};

const analytics = {
  total_places: 2,
  total_parties: 3,
  total_relationships: 4,
  total_active_relationships: 3,
  total_visit_authorizations: 6,
  total_visit_sessions: 3,
  total_checkpoint_events: 12,
  total_checkpoint_events_allowed: 10,
  total_checkpoint_events_denied: 2,
  total_active_presences: 1,
  total_admins: 2,
  total_roles: 3,
  time_series: {
    places: [{ date: "2026-01-01", count: 1 }],
    parties: [],
    relationships: [],
    visit_authorizations: [{ date: "2026-01-01", count: 5 }],
    visit_sessions: [],
    checkpoint_events: [
      { date: "2026-01-01", count: 2 },
      { date: "2026-01-02", count: 4 },
    ],
    allowed_passages: [
      { date: "2026-01-01", count: 2 },
      { date: "2026-01-02", count: 4 },
    ],
    denied_passages: [
      { date: "2026-01-01", count: 1 },
      { date: "2026-01-02", count: 3 },
    ],
  },
};

const attention = {
  site_id: "place",
  site_name: "Harbour Hotel",
  generated_at: "2026-01-01T10:00:00Z",
  total: 5,
  categories: [
    {
      kind: "access",
      count: 1,
      items: [
        {
          code: "access.awaiting_approval",
          kind: "access",
          subject_type: "visit_authorization",
          subject_id: "visit",
          site_id: "place",
          place_id: "place",
          place_name: "Harbour Hotel",
          party_name: "Alex Host",
          due_at: "2026-01-01T12:00:00Z",
          amount: null,
          currency: null,
        },
      ],
    },
    {
      kind: "billing",
      count: 4,
      items: [
        {
          code: "billing.charge_overdue",
          kind: "billing",
          subject_type: "charge_schedule",
          subject_id: "charge",
          site_id: "place",
          place_id: "place",
          place_name: "Harbour Hotel",
          party_name: "Payer",
          due_at: "2025-12-01T00:00:00Z",
          amount: "250.00",
          currency: "NGN",
        },
      ],
    },
  ],
};

describe("operating dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectedSite = { id: "place", name: "Harbour Hotel" };
    mocks.managementIsAdministrator = true;
    window.history.replaceState({}, "", "/admin");
    window.sessionStorage.clear();
    mocks.analyticsQuery.mockReturnValue({
      data: analytics,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.analyticsRefetch,
    });
    mocks.attentionQuery.mockReturnValue({
      data: attention,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.attentionRefetch,
    });
  });

  it("does not route first-Site setup through the management dashboard", () => {
    mocks.query.mockReturnValue({
      data: { ...dashboard, root_places: [] },
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    render(<AdminDashboardPage />);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Preparing workspace context",
    );
  });

  it("does not render the management dashboard without a site admin", () => {
    mocks.managementIsAdministrator = false;
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    render(<AdminDashboardPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Property management access required",
    );
  });

  it("offers retry after an initial failure", () => {
    mocks.query.mockReturnValue({
      isPending: false,
      isError: true,
      refetch: mocks.refetch,
    });
    render(<AdminDashboardPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dashboard unavailable",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it("renders canonical property, visit, and checkpoint data", () => {
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    render(<AdminDashboardPage />);
    expect(
      screen.getByRole("heading", { name: "Property operations" }),
    ).toBeInTheDocument();
    const placeScope = screen.getByRole("region", {
      name: "Place scope",
    });
    expect(
      within(placeScope).queryByRole("link", { name: /Harbour Hotel/ }),
    ).not.toBeInTheDocument();
    expect(within(placeScope).getByText("Harbour Hotel")).toBeInTheDocument();
    expect(screen.getByText("Invitation awaiting approval")).toBeInTheDocument();
    const activityTable = screen.getByRole("table", {
      name: "Recent checkpoint activity for Harbour Hotel",
    });
    expect(within(activityTable).getByText("Entry")).toBeInTheDocument();
    expect(within(activityTable).getByText("allowed")).toBeInTheDocument();
    expect(screen.getByText(/6 allowed/)).toBeInTheDocument();
    expect(screen.getByText(/4 denied/)).toBeInTheDocument();
  });

  it("groups overdue work in the attention queue", () => {
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    render(<AdminDashboardPage />);

    const queue = screen.getByRole("region", { name: "Attention required" });
    expect(within(queue).getByText("5 open")).toBeInTheDocument();
    expect(
      within(queue).getByText("Invitation awaiting approval"),
    ).toBeInTheDocument();
    expect(within(queue).getByText("Charge past due")).toBeInTheDocument();
    expect(within(queue).getByText("3 more in Billing")).toBeInTheDocument();
  });

  it("says so when nothing needs attention", () => {
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    mocks.attentionQuery.mockReturnValue({
      data: { ...attention, total: 0, categories: [] },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.attentionRefetch,
    });
    render(<AdminDashboardPage />);

    const queue = screen.getByRole("region", { name: "Attention required" });
    expect(
      within(queue).getByText("Nothing is overdue or waiting for a decision."),
    ).toBeInTheDocument();
  });

  it("warns when refresh fails but cached data remains", () => {
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: true,
      refetch: mocks.refetch,
    });
    render(<AdminDashboardPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The latest dashboard snapshot could not be loaded",
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });

  it("ignores the retired first-workspace setup query", async () => {
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    window.history.replaceState({}, "", "/admin?setup=first-workspace");
    render(<AdminDashboardPage />);

    expect(
      screen.queryByRole("heading", {
        name: "Your management workspace is ready",
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Review first site/ }),
    ).toBeNull();
  });

  it("shows people metrics without the retired roster link", () => {
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    render(<AdminDashboardPage />);
    expect(screen.getByText("People")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /active relationships/ }),
    ).toBeNull();
  });

  it("keeps access reports usable when analytics partially fails", () => {
    mocks.analyticsQuery.mockReturnValue({
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: mocks.analyticsRefetch,
    });
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.refetch,
    });

    render(<AdminDashboardPage />);

    expect(screen.getByText("Access trend unavailable")).toBeInTheDocument();
    expect(screen.getByText("Invitation awaiting approval")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.analyticsRefetch).toHaveBeenCalledOnce();
  });

  it("stores the reporting period in the URL", () => {
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.refetch,
    });

    render(<AdminDashboardPage />);
    fireEvent.change(screen.getByLabelText("Reporting period"), {
      target: { value: "30" },
    });

    expect(mocks.replace).toHaveBeenCalledWith("/admin?period=30");
  });
});
