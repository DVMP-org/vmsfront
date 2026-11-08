import { fireEvent, render, screen } from "@testing-library/react";
import { vi, describe, expect, it, beforeEach } from "vitest";
import AnalyticsPage from "./page";

const mocks = vi.hoisted(() => ({
  summary: vi.fn(),
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminAnalyticsSummary: mocks.summary,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
  Tooltip: () => null,
}));

const summary = {
  total_residents: 120,
  total_residencies: 84,
  total_gate_passes: 23,
  total_gate_events: 50,
  total_gate_events_approved: 45,
  total_gate_events_denied: 5,
  total_admins: 6,
  total_roles: 4,
  total_visitors: 32,
  time_series: {
    residencies: [{ date: "2026-11-01", count: 3 }],
    gate_passes: [{ date: "2026-11-01", count: 4 }],
    visitors: [{ date: "2026-11-01", count: 2 }],
    checkins: [{ date: "2026-11-01", count: 8 }],
    checkouts: [{ date: "2026-11-01", count: 6 }],
  },
};

function mount() {
  return render(<AnalyticsPage />);
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.summary.mockReturnValue({
    data: summary,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  });
});

describe("Operations Hub analytics", () => {
  it("shows exact metrics, decision health and chart data", () => {
    mount();

    expect(
      screen.getByRole("heading", { name: "Analytics" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Occupancy relationships")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getAllByText(/90\.0%/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByText("View chart data")[0]);
    expect(screen.getByRole("region", { name: "Daily activity data" })).toBeInTheDocument();
    expect(screen.getAllByText("Nov 01").length).toBeGreaterThan(0);
  });

  it("preserves a retryable failure state", () => {
    const refetch = vi.fn();
    mocks.summary.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch,
    });
    mount();

    expect(screen.getByText("Unable to load analytics")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
