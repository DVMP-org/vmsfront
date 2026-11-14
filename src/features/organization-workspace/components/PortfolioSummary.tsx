"use client";

import { Metric } from "./organization-ui";
import type { PortfolioMetrics } from "../lib";

export function PortfolioSummary({ metrics }: { metrics: PortfolioMetrics }) {
    return (
        <section
            aria-label="Portfolio summary"
            className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-2 xl:grid-cols-4"
        >
            <div className="border-b border-[var(--vms-line)] sm:border-r xl:border-b-0">
                <Metric
                    label="Total Sites"
                    value={metrics.totalSites}
                    detail="Operating boundaries"
                />
            </div>
            <div className="border-b border-[var(--vms-line)] xl:border-b-0 xl:border-r">
                <Metric
                    label="Total Places"
                    value={metrics.totalPlaces}
                    detail="Managed units and spaces"
                />
            </div>
            <div className="border-b border-[var(--vms-line)] sm:border-b-0 sm:border-r">
                <Metric
                    label="Organization Members"
                    value={metrics.totalMembers}
                    detail="Organization administrators"
                />
            </div>
            <div>
                <Metric
                    label="Active Integrations"
                    value={metrics.activeIntegrations}
                    detail="Connected providers"
                />
            </div>
        </section>
    );
}
