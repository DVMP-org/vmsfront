"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { hasAdminPermission } from "@/lib/permissions";
import { useAppStore } from "@/store/app-store";
import { parseApiError } from "@/lib/error-utils";
import { MetricStrip } from "@/features/dashboard/MetricStrip";

import type { CreatedOrganizationSite } from "../api";
import { useOrganizationOverview } from "../queries";
import { CreateSiteDrawer } from "./CreateSiteDrawer";
import { OrganizationHeader } from "./OrganizationHeader";
import { PortfolioSetup } from "./PortfolioSetup";
import { PortfolioSummary } from "./PortfolioSummary";
import { RecentActivity } from "./RecentActivity";
import { SiteDirectoryPreview } from "./SiteDirectoryPreview";

export function OrganizationHome() {
  const overview = useOrganizationOverview();
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<CreatedOrganizationSite | null>(null);
  const organization = overview.organization;
  const canCreate = hasAdminPermission(overview.profile.data, "places.create");
  const sites = overview.sites.data ?? [];

  if (overview.isError) {
    return (
      <InlineAlert
        tone="danger"
        title="Organization home is unavailable"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => overview.refetch()}
          >
            Retry
          </Button>
        }
      >
        {parseApiError(overview.error).message}
      </InlineAlert>
    );
  }

  if (overview.isLoading || overview.sites.isPending || !organization) {
    return <OrganizationHomeSkeleton />;
  }

  return (
    <div className="space-y-5">
      <OrganizationHeader
        name={organization.name}
        description={organization.description}
        canCreate={canCreate && sites.length > 0}
        onCreate={() => setCreateOpen(true)}
      />

      {created ? (
        <InlineAlert
          tone="success"
          title={`${created.name} is ready`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                asChild
                onClick={() =>
                  useAppStore
                    .getState()
                    .setSelectedSite({ id: created.id, name: created.name })
                }
              >
                <Link href="/admin/site/configuration">
                  Configure Site
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCreated(null)}
              >
                Dismiss
              </Button>
            </div>
          }
        >
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            The Site is now in the portfolio directory. No Places were created.
          </span>
        </InlineAlert>
      ) : null}

      <PortfolioSummary
        metrics={overview.metrics}
        sitesAvailable={overview.sites.isSuccess}
        integrationsAvailable={overview.integrations.isSuccess}
      />

      {overview.sites.isError ? (
        <InlineAlert
          tone="warning"
          title="Site portfolio could not be refreshed"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => overview.sites.refetch()}
            >
              Retry
            </Button>
          }
        >
          {parseApiError(overview.sites.error).message}
        </InlineAlert>
      ) : null}

      <div
        className={
          overview.sites.isError
            ? "grid items-start gap-4"
            : "grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]"
        }
      >
        {!overview.sites.isError ? (
          <div className="space-y-4">
            <PortfolioSetup
              sites={sites}
              canCreate={canCreate}
              onCreate={() => setCreateOpen(true)}
            />
            <SiteDirectoryPreview sites={sites} />
          </div>
        ) : null}
        <div className="space-y-4">
          <RecentActivity events={overview.activity.slice(0, 4)} />
        </div>
      </div>

      <CreateSiteDrawer
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        slug={overview.slug}
        sites={sites}
        onCreated={(site) => setCreated(site)}
      />
    </div>
  );
}

function OrganizationHomeSkeleton() {
  return (
    <div role="status" className="space-y-5">
      <span className="sr-only">Loading organization home</span>
      <div className="space-y-2 border-b border-[var(--vms-line)] pb-5">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
        <div className="h-8 w-64 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
      </div>
      <MetricStrip
        label="Portfolio summary"
        metrics={[
          "Total Sites",
          "Total Places",
          "Organization Members",
          "Active Integrations",
        ].map((label) => ({
          label,
          value: "",
          detail: "Loading current data…",
          state: "loading" as const,
        }))}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]">
        <div className="h-72 animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]" />
        <div className="h-72 animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]" />
      </div>
    </div>
  );
}
