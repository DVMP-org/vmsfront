import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecentContextBar } from "./RecentContextBar";

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  workspaceModules: ["check_in_out"],
  dashboard: {
    data: {
      metrics: {
        pending_visit_authorizations: 2,
        active_visit_sessions: 1,
      },
      recent_checkpoint_events: [
        {
          id: "event-1",
          direction: "entry",
          outcome: "allowed",
          occurred_at: "2026-11-07T12:55:00.000Z",
        },
      ],
    },
    isError: false,
  },
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      organization: { id: "org", name: "Harbour Estate" },
      selectedProperty: { id: "office", name: "Harbour Offices" },
    }),
}));

vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => ({
    data: {
      effective_use_case: "commercial",
      modules: mocks.workspaceModules,
    },
  }),
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminDashboard: () => ({
    data: mocks.dashboard.data,
    isError: mocks.dashboard.isError,
    refetch: mocks.refetch,
  }),
}));

describe("RecentContextBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-07T13:00:00.000Z"));
    mocks.workspaceModules = ["check_in_out"];
    mocks.dashboard.isError = false;
    mocks.refetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the active property, work queue and recent checkpoint context", () => {
    render(<RecentContextBar />);

    expect(screen.getByText("Property context")).toBeInTheDocument();
    expect(screen.getByText(/Harbour Offices/)).toHaveTextContent("commercial");
    expect(
      screen.getByRole("link", { name: /Awaiting approval 2/ }),
    ).toHaveAttribute("href", "/admin/checkpoints");
    expect(screen.getByRole("link", { name: /On site 1/ })).toHaveAttribute(
      "href",
      "/admin/checkpoints",
    );
    expect(screen.getByText(/Recent entry allowed/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Switch workspace/ }),
    ).toHaveAttribute("href", "/select");
  });

  it("offers a retry instead of presenting stale work counts after failure", () => {
    mocks.dashboard.isError = true;
    render(<RecentContextBar />);

    expect(screen.queryByText("Awaiting approval")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Work queue unavailable" }),
    );
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it("does not expose the access work queue without its module grant", () => {
    mocks.workspaceModules = [];
    render(<RecentContextBar />);

    expect(screen.queryByText("Awaiting approval")).toBeNull();
    expect(screen.queryByText("On site")).toBeNull();
    expect(
      screen.getByRole("link", { name: /Switch workspace/ }),
    ).toBeInTheDocument();
  });
});
