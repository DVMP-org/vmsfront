"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Calculator,
  Receipt,
  Share2,
  Users,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { contextualAdminLinks } from "@/config/admin-routes";
import { AttentionQueueSection } from "@/features/dashboard/AttentionQueueSection";
import {
  PanelState,
  ReportPanel,
} from "@/features/dashboard/DashboardPrimitives";
import {
  MetricStrip,
  type MetricDefinition,
} from "@/features/dashboard/MetricStrip";
import { useSiteAccess } from "@/features/context/use-site-access";
import { placesApi, type PlaceTreeNode } from "@/features/places/api";
import { useAppStore } from "@/store/app-store";
import { mixedUseApi } from "./api";
import { MixedUseShell } from "./MixedUseShell";

const modules = [
  {
    href: "/admin/places",
    label: "Buildings & spaces",
    description: "Unified building, unit, room and common-space inventory.",
    icon: Building2,
  },
  {
    href: "/admin/people",
    label: "Occupancy & tenancies",
    description: "Residents, tenants, businesses, staff and guests by space.",
    icon: Users,
  },
  {
    href: "/admin/charges",
    label: "Charge definitions",
    description:
      "Define reusable amounts and schedules, then assign them to spaces.",
    icon: Receipt,
  },
  {
    href: "/admin/mixed-use/maintenance",
    label: "Facilities & maintenance",
    description: "Shared infrastructure and domain-classified work orders.",
    icon: Wrench,
  },
  {
    href: "/admin/mixed-use/facilities",
    label: "Shared facilities",
    description: "Amenities and capacity shared across property domains.",
    icon: Share2,
  },
  {
    href: "/admin/mixed-use/expenses",
    label: "Expense allocation",
    description: "Recoverable shared costs allocated by domain or space.",
    icon: Calculator,
  },
];

export function MixedUseOverview() {
  const selectedSite = useAppStore((state) => state.selectedSite);
  const access = useSiteAccess();
  const navigation = contextualAdminLinks(
    access.workspace.data?.modules,
    access.workspace.data?.module_groups,
    "mixed_use",
  );
  const availableRoutes = new Set(
    navigation
      .flatMap((item) => [item, ...(item.children ?? [])])
      .filter(
        (item) =>
          (!item.permission || access.allowed(item.permission)) &&
          (item.href !== "/admin/places" || access.allowed("places.list")),
      )
      .map((item) => item.href),
  );
  const canViewPlaces = availableRoutes.has("/admin/places");
  const canViewFacilities =
    availableRoutes.has("/admin/mixed-use/facilities") &&
    access.allowed("places.show");
  const canViewAllocations =
    availableRoutes.has("/admin/mixed-use/expenses") &&
    access.allowed("charges.show");
  const visibleModules = modules.filter(
    (item) =>
      availableRoutes.has(item.href) &&
      (item.href !== "/admin/mixed-use/facilities" || canViewFacilities) &&
      (item.href !== "/admin/mixed-use/expenses" || canViewAllocations),
  );
  const facilities = useQuery({
    queryKey: ["mixed-use-overview-facilities", access.contextKey],
    queryFn: () =>
      mixedUseApi.listFacilities(selectedSite!.id, {
        page: 1,
        page_size: 1,
        active: true,
      }),
    enabled: !!selectedSite?.id && canViewFacilities,
    retry: false,
  });
  const allocations = useQuery({
    queryKey: ["mixed-use-overview-allocations", access.contextKey],
    queryFn: () =>
      mixedUseApi.listAllocations(selectedSite!.id, {
        page: 1,
        page_size: 1,
        status: "approved",
      }),
    enabled: !!selectedSite?.id && canViewAllocations,
    retry: false,
  });
  const tree = useQuery({
    queryKey: ["mixed-use-overview-tree", access.contextKey],
    queryFn: () =>
      selectedSite?.id ? placesApi.tree(selectedSite.id) : Promise.resolve([]),
    enabled: !!selectedSite?.id && canViewPlaces,
    retry: false,
  });
  const spaceCount = (tree.data ?? []).reduce(
    (count, node) => count + 1 + countDescendants(node),
    0,
  );
  const firstUse = canViewPlaces && tree.isSuccess && spaceCount === 0;
  const summaryMetrics: MetricDefinition[] = [];
  if (canViewPlaces) {
    summaryMetrics.push({
      label: "Spaces in scope",
      value: spaceCount,
      detail: "Buildings, units, rooms and shared spaces in this Site",
      icon: Building2,
      state: tree.isPending ? "loading" : tree.isError ? "error" : "ready",
    });
  }
  if (canViewFacilities) {
    summaryMetrics.push({
      label: "Active shared facilities",
      value: facilities.data?.total ?? 0,
      detail: "Facilities currently enabled for this Site",
      icon: Share2,
      state: facilities.isPending
        ? "loading"
        : facilities.isError
          ? "error"
          : "ready",
    });
  }
  if (canViewAllocations) {
    summaryMetrics.push({
      label: "Approved allocations",
      value: allocations.data?.total ?? 0,
      detail: "Approved shared cost allocations at this Site",
      icon: Calculator,
      state: allocations.isPending
        ? "loading"
        : allocations.isError
          ? "error"
          : "ready",
    });
  }

  return (
    <MixedUseShell
      title="Operations"
      description="One operating view across residential, commercial, hospitality and shared spaces."
    >
      {access.workspace.isPending ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
          <PanelState
            compact
            kind="loading"
            title="Loading Site operations"
            description="Checking the available modules and operating summary."
          />
        </section>
      ) : firstUse ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">
            Set up your mixed-use spaces
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Start with buildings, units, rooms or shared spaces. Use Places to
            organize the people and work at each location; the Site's enabled
            modules determine which workflows are available.
          </p>
          {access.allowed("places.create") ? (
            <Button asChild className="mt-4">
              <Link href="/admin/places">Set up places</Link>
            </Button>
          ) : (
            <p className="mt-3 text-sm text-[var(--vms-ink-muted)]">
              Ask a Site administrator to configure the place inventory.
            </p>
          )}
        </section>
      ) : (
        <MetricStrip
          label="Mixed-use operating summary"
          metrics={summaryMetrics}
        />
      )}
      {tree.isError || facilities.isError || allocations.isError ? (
        <PanelState
          compact
          kind="error"
          title="Some mixed-use data is unavailable"
          description="Retry the unavailable Site operations data."
          isRetrying={
            tree.isFetching || facilities.isFetching || allocations.isFetching
          }
          onRetry={() => {
            if (canViewPlaces && tree.isError) void tree.refetch();
            if (canViewFacilities && facilities.isError)
              void facilities.refetch();
            if (canViewAllocations && allocations.isError)
              void allocations.refetch();
          }}
        />
      ) : null}

      <AttentionQueueSection
        useCase="mixed_use"
        propertyName={selectedSite?.name || "this property"}
      />

      <ReportPanel
        title="Site operations"
        description="Open the inventory, relationships and shared operations for this Site."
      >
        <div className="grid gap-px bg-[var(--vms-line)] sm:grid-cols-2 xl:grid-cols-3">
          {visibleModules.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group bg-[var(--vms-surface)] p-5 transition-colors hover:bg-[var(--vms-surface-subtle)]"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{label}</h3>
              <p className="mt-1 text-sm leading-5 text-[var(--vms-ink-muted)]">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--vms-action)]">
                Open module
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
        {!visibleModules.length ? (
          <p className="p-5 text-sm text-[var(--vms-ink-muted)]">
            {access.workspace.isPending
              ? "Loading available operations…"
              : "No operation shortcuts are available for your current Site access."}
          </p>
        ) : null}
      </ReportPanel>
    </MixedUseShell>
  );
}

function countDescendants(node: PlaceTreeNode): number {
  return (node.children ?? []).reduce(
    (total, child) => total + 1 + countDescendants(child),
    0,
  );
}
