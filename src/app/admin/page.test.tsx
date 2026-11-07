import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "./page";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  refetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/hooks/use-admin", () => ({ useAdminDashboard: mocks.query }));
vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => ({
    data: { effective_use_case: "mixed_use" },
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

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

describe("operating dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/admin");
    window.sessionStorage.clear();
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
      screen.getByRole("heading", { name: "Operating dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Harbour Hotel" })).toHaveAttribute(
      "href",
      "/admin/properties/place",
    );
    expect(screen.getByText("Guest arrival")).toBeInTheDocument();
    expect(screen.getByText("Check-in · allowed")).toBeInTheDocument();
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
      "Showing the last successful snapshot",
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
    fireEvent.click(
      screen.getByRole("button", { name: /Review first property/ }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/admin/properties");
  });
});
