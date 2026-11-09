"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FirstWorkspaceSetup } from "@/components/onboarding/FirstWorkspaceSetup";
import type { DashboardRange } from "@/features/dashboard/AccessTrendPanel";
import {
  DashboardSkeleton,
  PanelState,
} from "@/features/dashboard/DashboardPrimitives";
import { OperationsDashboard } from "@/features/dashboard/OperationsDashboard";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { useAdminAnalyticsSummary, useAdminDashboard } from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import type { AdminDashboard } from "@/types";

const validRanges: DashboardRange[] = [7, 14, 30];

function initialRange(): DashboardRange {
  if (typeof window === "undefined") return 14;
  const value = Number(
    new URLSearchParams(window.location.search).get("period"),
  );
  return validRanges.includes(value as DashboardRange)
    ? (value as DashboardRange)
    : 14;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const dashboard = useAdminDashboard();
  const analytics = useAdminAnalyticsSummary();
  const context = useWorkspaceContext();
  const organization = useAppStore((state) => state.organization);
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const data = dashboard.data as AdminDashboard | undefined;
  const [showFirstWorkspaceSetup, setShowFirstWorkspaceSetup] = useState(false);
  const [range, setRange] = useState<DashboardRange>(14);

  useEffect(() => {
    setRange(initialRange());
    const params = new URLSearchParams(window.location.search);
    const requested =
      params.get("setup") === "first-workspace" ||
      window.sessionStorage.getItem("organization-setup-step") ===
        "first-workspace";
    if (requested) setShowFirstWorkspaceSetup(true);
  }, []);

  useEffect(() => {
    if (!data) return;
    if (!data.root_places.length) return;
    if (!selectedProperty) {
      router.replace("/admin/properties");
    }
  }, [data, router, selectedProperty]);

  function handleRangeChange(nextRange: DashboardRange) {
    setRange(nextRange);
    const params = new URLSearchParams(window.location.search);
    params.set("period", String(nextRange));
    router.replace(`/admin?${params.toString()}`);
  }

  if (dashboard.isPending || context.isPending) return <DashboardSkeleton />;

  if (dashboard.isError && !data) {
    return (
      <PanelState
        kind="error"
        title="Dashboard unavailable"
        description={parseApiError(dashboard.error).message}
        onRetry={() => dashboard.refetch()}
        isRetrying={dashboard.isFetching}
      />
    );
  }

  if (!data?.root_places.length || !selectedProperty) {
    return (
      <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
        Preparing workspace context…
      </p>
    );
  }

  if (!context.data?.management?.is_administrator) {
    return (
      <div
        role="alert"
        className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-warning)_35%,white)] bg-[var(--vms-warning-subtle)] p-5 text-sm text-[var(--vms-ink)]"
      >
        <p className="font-semibold">Property management access required</p>
        <p className="mt-1 text-[var(--vms-ink-muted)]">
          The management dashboard belongs to a property. Select a property you
          administer or return to the organization workspace.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/organization/workspaces">Choose a workspace</Link>
        </Button>
      </div>
    );
  }

  const useCase =
    context.data.effective_use_case?.replaceAll("_", " ") ||
    organization?.use_case?.replaceAll("_", " ") ||
    "operations";

  return (
    <OperationsDashboard
      data={data}
      analytics={analytics.data}
      analyticsPending={analytics.isPending}
      analyticsError={analytics.isError}
      analyticsFetching={analytics.isFetching}
      range={range}
      onRangeChange={handleRangeChange}
      onRetryAnalytics={() => analytics.refetch()}
      isStale={dashboard.isError}
      isFetching={dashboard.isFetching}
      onRetryDashboard={() => dashboard.refetch()}
      propertyName={selectedProperty.name}
      organizationName={organization?.name || "Organization"}
      useCase={useCase}
      updatedAt={dashboard.dataUpdatedAt}
      setupPanel={
        showFirstWorkspaceSetup ? (
          <FirstWorkspaceSetup
            rootPlaceCount={data.root_places.length}
            onOpenProperties={() => {
              window.sessionStorage.removeItem("organization-setup-step");
              setShowFirstWorkspaceSetup(false);
              router.push("/admin/site/configuration");
            }}
            onDismiss={() => {
              window.sessionStorage.removeItem("organization-setup-step");
              setShowFirstWorkspaceSetup(false);
            }}
          />
        ) : null
      }
    />
  );
}
