import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AnalyticsSummary } from "@/types";
import { AccessTrendPanel, buildDecisionSeries } from "./AccessTrendPanel";

const baseAnalytics: AnalyticsSummary = {
  total_places: 1,
  total_parties: 2,
  total_relationships: 1,
  total_active_relationships: 1,
  total_visit_authorizations: 1,
  total_visit_sessions: 1,
  total_checkpoint_events: 3,
  total_checkpoint_events_allowed: 2,
  total_checkpoint_events_denied: 1,
  total_active_presences: 0,
  total_admins: 1,
  total_roles: 1,
  time_series: {
    places: [],
    parties: [],
    relationships: [],
    visit_authorizations: [],
    visit_sessions: [],
    checkpoint_events: [{ date: "2026-11-01T00:00:00", count: 3 }],
    allowed_passages: [{ date: "2026-11-01T00:00:00", count: 2 }],
    denied_passages: [{ date: "2026-11-01T00:00:00", count: 1 }],
  },
};

describe("AccessTrendPanel", () => {
  it("uses canonical allowed and denied passage series", () => {
    expect(buildDecisionSeries(baseAnalytics, 14)).toEqual([
      expect.objectContaining({
        date: "2026-11-01",
        allowed: 2,
        denied: 1,
      }),
    ]);
  });

  it("tolerates a summary without time-series data", () => {
    render(
      <AccessTrendPanel
        analytics={{ ...baseAnalytics, time_series: null }}
        range={14}
        isLoading={false}
        isError={false}
        isFetching={false}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No checkpoint decisions in this period"),
    ).toBeInTheDocument();
  });

  it("tolerates malformed decision series without crashing", () => {
    expect(
      buildDecisionSeries(
        {
          ...baseAnalytics,
          time_series: {
            ...baseAnalytics.time_series!,
            allowed_passages: null as never,
            denied_passages: { unexpected: true } as never,
          },
        },
        14,
      ),
    ).toEqual([]);
  });
});
