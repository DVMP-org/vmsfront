import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "./page";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  analyticsQuery: vi.fn(),
  refetch: vi.fn(),
  analyticsRefetch: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  selectedProperty: { id: "place", name: "Harbour Hotel" } as {
    id: string;
    name: string;
  } | null,
  managementIsAdministrator: true,
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminDashboard: mocks.query,
  useAdminAnalyticsSummary: mocks.analyticsQuery,
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
    selector({ selectedProperty: mocks.selectedProperty }),
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
  total_residents: 3,
  total_residencies: 2,
  total_gate_passes: 6,
  total_gate_events: 12,
  total_gate_events_approved: 10,
  total_gate_events_denied: 2,
  total_admins: 2,
  total_roles: 3,
  total_visitors: 5,
  time_series: {
    residencies: [],
    gate_passes: [],
    visitors: [],
    checkins: [
      { date: "2026-01-01", count: 2 },
      { date: "2026-01-02", count: 4 },
    ],
    checkouts: [
      { date: "2026-01-01", count: 1 },
      { date: "2026-01-02", count: 3 },
    ],
  },
};

describe("operating dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectedProperty = { id: "place", name: "Harbour Hotel" };
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
  });

  it("does not route first-place setup through the management dashboard", () => {
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

  it("does not render the management dashboard without a place admin", () => {
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
    const propertyScope = screen.getByRole("region", {
      name: "Property scope",
    });
    expect(
      within(propertyScope).getByRole("link", { name: /Harbour Hotel/ }),
    ).toHaveAttribute("href", "/admin/properties/place");
    expect(screen.getByText("Guest arrival")).toBeInTheDocument();
    const activityTable = screen.getByRole("table", {
      name: "Recent checkpoint activity for Harbour Hotel",
    });
    expect(within(activityTable).getByText("Entry")).toBeInTheDocument();
    expect(within(activityTable).getByText("allowed")).toBeInTheDocument();
    expect(screen.getByText(/6 check-ins/)).toBeInTheDocument();
    expect(screen.getByText(/4 check-outs/)).toBeInTheDocument();
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

  it("continues the first-workspace setup checklist after plan activation", async () => {
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    window.history.replaceState({}, "", "/admin?setup=first-workspace");
    render(<AdminDashboardPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Your management workspace is ready",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Review first site/ }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/properties");
  });

  it("routes people work to the canonical property roster", () => {
    mocks.query.mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    render(<AdminDashboardPage />);
    expect(
      screen.getByRole("link", { name: /active relationships/ }),
    ).toHaveAttribute("href", "/admin/people");
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
    expect(screen.getByText("Guest arrival")).toBeInTheDocument();
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
