"use client";

import Link from "next/link";
import { ArrowRight, Building2, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { OrganizationSiteSummary } from "../api";
import { ORGANIZATION_SITES_PATH } from "../lib";
import { SectionHeading, SurfaceCard } from "./organization-ui";

export function PortfolioSetup({
  sites,
  canCreate,
  onCreate,
}: {
  sites: OrganizationSiteSummary[];
  canCreate: boolean;
  onCreate: () => void;
}) {
  if (sites.length === 0) {
    return (
      <SurfaceCard>
        <SectionHeading title="Start with a Site" />
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
            A Site defines the operating boundary for Places and management.
            Create one before setting up its spaces and workflows.
          </p>
          {canCreate ? (
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Site
            </Button>
          ) : (
            <p className="text-xs leading-5 text-[var(--vms-ink-muted)]">
              Ask an organization administrator with Site creation access to
              start the portfolio.
            </p>
          )}
        </div>
      </SurfaceCard>
    );
  }

  const sitesWithoutPlaces = sites.filter(
    (site) => site.is_active && site.place_count === 0,
  );
  if (sitesWithoutPlaces.length === 0) return null;

  return (
    <SurfaceCard>
      <SectionHeading
        title="Sites without Places"
        description={`${sitesWithoutPlaces.length} active ${sitesWithoutPlaces.length === 1 ? "Site has" : "Sites have"} no physical Places yet.`}
        action={
          sitesWithoutPlaces.length > 3 ? (
            <Link
              href={ORGANIZATION_SITES_PATH}
              className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[var(--vms-ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
            >
              View all Sites
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : null
        }
      />
      <ul className="divide-y divide-[var(--vms-line)]">
        {sitesWithoutPlaces.slice(0, 3).map((site) => (
          <li key={site.id}>
            <Link
              href={`/organization/sites/${site.id}`}
              className="flex min-h-12 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] sm:px-5"
            >
              <Building2
                className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 break-words text-sm font-medium text-[var(--vms-ink)]">
                {site.name}
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}
