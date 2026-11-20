"use client";

import { MetricStrip } from "@/features/dashboard/MetricStrip";
import type { PortfolioMetrics } from "../lib";

export function PortfolioSummary({
  metrics,
  sitesAvailable,
  integrationsAvailable,
}: {
  metrics: PortfolioMetrics;
  sitesAvailable: boolean;
  integrationsAvailable: boolean;
}) {
  return (
    <MetricStrip
      label="Portfolio summary"
      metrics={[
        {
          label: "Total Sites",
          value: sitesAvailable ? metrics.totalSites : "—",
          detail: "Operating boundaries",
        },
        {
          label: "Total Places",
          value: sitesAvailable ? metrics.totalPlaces : "—",
          detail: "Managed units and spaces",
        },
        {
          label: "Organization Members",
          value: metrics.totalMembers,
          detail: "Organization administrators",
        },
        {
          label: "Active Integrations",
          value: integrationsAvailable ? metrics.activeIntegrations : "—",
          detail: integrationsAvailable
            ? "Connected providers"
            : "Unavailable or restricted",
        },
      ]}
    />
  );
}
