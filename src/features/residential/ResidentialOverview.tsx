"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Clock3,
  Home,
  Megaphone,
  Plus,
  RefreshCw,
  UserCheck,
  UsersRound,
  WalletCards,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { format } from "date-fns/format";
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";

import { MetricStrip } from "@/features/dashboard/MetricStrip";
import { Button, buttonVariants } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import type { Assignment } from "@/features/charges/api";
import {
  maintenanceApi,
  type MaintenanceRequest,
} from "@/features/maintenance/api";
import type { WorkspaceRelationship } from "@/types";
import { formatMoneyWithCode } from "@/lib/currency";
import { parseApiError } from "@/lib/error-utils";
import { AttentionQueueSection } from "@/features/dashboard/AttentionQueueSection";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { PendingHouseholdsPanel } from "./PendingHouseholdsPanel";
import { descendantIds, flattenPlaces, residentialApi } from "./api";
import { occupancyRoles, titleCase, type Announcement } from "./contracts";

interface UnitActivityRow {
  id: string;
  name: string;
  building: string;
  residents: string;
  occupancyStatus: "occupied" | "vacant";
  balance: string | null;
  openRequests: number | null;
  updatedAt: string;
}

interface ActivityEntry {
  id: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  occurredAt: string;
  tone: "success" | "info" | "warning";
}

export default function ResidentialOverview() {
  const { selectedSite, contextKey, canManageUnits, canManageVisitors } =
    useResidentialAccess();
  const placeId = selectedSite?.id || "";
  const tree = useQuery({
    queryKey: ["residential", contextKey, "tree"],
    queryFn: residentialApi.tree,
    enabled: !!placeId,
  });
  const scopeIds = tree.data
    ? descendantIds(tree.data, placeId)
    : new Set<string>();
  const places = tree.data ? flattenPlaces(tree.data) : [];
  const units = places.filter(
    (place) => scopeIds.has(place.id) && place.kind === "unit",
  );
  const unitIds = new Set(units.map((unit) => unit.id));
  const relationships = useQuery({
    queryKey: ["residential", contextKey, "relationships", placeId, "all"],
    queryFn: () => residentialApi.relationships(),
    enabled: !!placeId,
  });
  const chargeAssignments = useQuery({
    queryKey: ["residential", contextKey, "charge-assignments", placeId],
    queryFn: residentialApi.chargeAssignments,
    enabled: !!placeId,
    retry: false,
  });
  const maintenance = useQuery({
    queryKey: ["residential", contextKey, "maintenance", placeId, "overview"],
    queryFn: () =>
      maintenanceApi.list({ page_size: 100, domain: "residential" }),
    enabled: !!placeId,
    retry: false,
  });
  const announcements = useQuery({
    queryKey: ["residential", contextKey, "announcements", placeId, "overview"],
    queryFn: () => residentialApi.announcements({ page_size: 20 }),
    enabled: !!placeId,
    retry: false,
  });

  const scopedRelationships = (relationships.data?.items || []).filter((row) =>
    scopeIds.has(row.place.id),
  );
  const activeRelationships = scopedRelationships.filter(
    (row) =>
      row.status === "active" &&
      unitIds.has(row.place.id) &&
      occupancyRoles.includes(row.role as never),
  );
  const pendingRelationships = scopedRelationships.filter(
    (row) =>
      row.status === "pending" &&
      unitIds.has(row.place.id) &&
      occupancyRoles.includes(row.role as never),
  );
  const relationshipsComplete =
    !!relationships.data &&
    relationships.data.total <= relationships.data.items.length;
  const relationshipsByUnit = groupRelationships(activeRelationships);
  const occupiedUnitIds = new Set(
    activeRelationships.map((row) => row.place.id),
  );
  const scopedAssignments = (chargeAssignments.data || []).filter(
    (assignment) => scopeIds.has(assignment.target_place.id),
  );
  const outstandingAssignments = scopedAssignments.filter(
    (assignment) => Number(assignment.outstanding_amount || 0) > 0,
  );
  const outstandingLabel =
    formatAssignmentBalances(outstandingAssignments) || "No balance due";
  const openMaintenance = (maintenance.data?.items || []).filter(
    (request) => !["resolved", "closed"].includes(request.status),
  );
  const assignmentsByPlace = groupAssignments(scopedAssignments);
  const maintenanceByPlace = groupMaintenance(openMaintenance);
  const unitRows = units.map((unit) => {
    const unitRelationships = relationshipsByUnit.get(unit.id) || [];
    const unitAssignments = assignmentsByPlace.get(unit.id) || [];
    const unitRequests = maintenanceByPlace.get(unit.id) || [];
    const updatedAt = [
      unit.updated_at,
      ...unitRelationships.map((row) => row.updated_at),
      ...unitRequests.map((request) => request.updated_at),
    ]
      .filter(Boolean)
      .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
    return {
      id: unit.id,
      name: unit.name,
      building: parentName(places, unit.parent_id),
      residents:
        unitRelationships
          .map((row) => row.party.display_name)
          .filter(Boolean)
          .join(", ") || "No active household",
      occupancyStatus: unitRelationships.length ? "occupied" : "vacant",
      balance: formatAssignmentBalances(unitAssignments),
      openRequests:
        maintenance.isPending || maintenance.isError
          ? null
          : unitRequests.length,
      updatedAt,
    } satisfies UnitActivityRow;
  });
  const recentActivity = buildRecentActivity({
    relationships: scopedRelationships,
    maintenance: openMaintenance,
    announcements: announcements.data?.items || [],
  });
  const loading =
    tree.isPending || relationships.isPending || chargeAssignments.isPending;
  const hasLoadError =
    tree.isError ||
    relationships.isError ||
    chargeAssignments.isError ||
    maintenance.isError ||
    announcements.isError;
  const occupancyPercent =
    relationshipsComplete && units.length
      ? Math.round((occupiedUnitIds.size / units.length) * 100)
      : null;

  return (
    <ResidentialShell
      title="Overview"
      description={`Units, occupancy, finance and operations for ${selectedSite?.name || "the selected property"}.`}
      primaryAction={
        canManageUnits ? (
          <Link
            href="/admin/residential/units?create=1"
            className={buttonVariants({ variant: "primary" })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add unit
          </Link>
        ) : undefined
      }
    >
      <MetricStrip
        label="Residential operating summary"
        metrics={[
          {
            icon: Building2,
            label: "Units",
            value: units.length,
            detail: "Units in the selected Site hierarchy",
            state: tree.isPending
              ? "loading"
              : tree.isError
                ? "error"
                : "ready",
          },
          {
            icon: UsersRound,
            label: "Occupied",
            value: relationshipsComplete
              ? occupiedUnitIds.size
              : `≥${occupiedUnitIds.size}`,
            detail: units.length
              ? occupancyPercent === null
                ? "Known occupied units; full rate unavailable"
                : `${occupancyPercent}% of units occupied`
              : "No units configured",
            state:
              tree.isPending || relationships.isPending
                ? "loading"
                : tree.isError || relationships.isError
                  ? "error"
                  : "ready",
          },
          {
            icon: WalletCards,
            label: "Charges due",
            value: outstandingLabel,
            detail: "Outstanding assigned charges in this Site",
            state:
              tree.isPending || chargeAssignments.isPending
                ? "loading"
                : tree.isError || chargeAssignments.isError
                  ? "error"
                  : "ready",
          },
          {
            icon: Wrench,
            label: "Open requests",
            value: openMaintenance.length,
            detail: "Open requests in the loaded maintenance results",
            state: maintenance.isPending
              ? "loading"
              : maintenance.isError
                ? "error"
                : "ready",
          },
        ]}
      />

      <AttentionQueueSection
        useCase="residential"
        propertyName={selectedSite?.name || "this property"}
      />

      {hasLoadError ? (
        <section
          role="status"
          className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-4 text-sm text-[var(--vms-warning)] sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Some operating data could not be refreshed. Available sections
            remain usable.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void Promise.all([
                tree.refetch(),
                relationships.refetch(),
                chargeAssignments.refetch(),
                maintenance.refetch(),
                announcements.refetch(),
              ]);
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry all
          </Button>
        </section>
      ) : null}

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <PendingHouseholdsPanel
          relationships={pendingRelationships}
          isLoading={tree.isPending || relationships.isPending}
          error={
            tree.isError
              ? parseApiError(tree.error).message
              : relationships.isError
                ? parseApiError(relationships.error).message
                : null
          }
          isComplete={relationshipsComplete}
          onRetry={() => {
            void tree.refetch();
            void relationships.refetch();
          }}
        />

        <section className="flex h-full flex-col rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                Occupancy breakdown
              </h2>
              <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                Current unit occupancy at{" "}
                {selectedSite?.name || "this property"}.
              </p>
            </div>
          </div>
          {tree.isPending || relationships.isPending ? (
            <PanelState
              compact
              kind="loading"
              title="Loading occupancy"
              description="Checking units and household relationships."
            />
          ) : tree.isError || relationships.isError ? (
            <PanelState
              compact
              kind="error"
              title="Occupancy is unavailable"
              description="The unit or household data could not be loaded."
              onRetry={() => {
                void tree.refetch();
                void relationships.refetch();
              }}
            />
          ) : units.length === 0 ? (
            <PanelState
              compact
              kind="empty"
              title="No units configured"
              description="Add units to start tracking occupancy."
            />
          ) : occupancyPercent === null ? (
            <div
              role="status"
              className="my-4 flex flex-1 flex-col justify-center gap-2 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-4"
            >
              <strong className="text-sm font-semibold">
                Full occupancy rate unavailable
              </strong>
              <p className="text-sm text-[var(--vms-ink-muted)]">
                At least {occupiedUnitIds.size} of {units.length} units have
                active households in the loaded relationship page. Open
                Residents &amp; households for the complete register.
              </p>
            </div>
          ) : (
            <div className="my-4 grid flex-1 grid-cols-[112px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[128px_minmax(0,1fr)]">
              <div
                className="relative mx-auto grid aspect-square h-28 w-28 shrink-0 place-items-center rounded-full sm:h-32 sm:w-32"
                style={{
                  background: `conic-gradient(var(--vms-success) ${occupancyPercent}%, var(--vms-surface-subtle) ${occupancyPercent}% 100%)`,
                }}
                aria-label={`${occupancyPercent}% of units occupied`}
                role="img"
              >
                <div className="grid h-20 w-20 place-items-center sm:h-24 sm:w-24 rounded-full bg-[var(--vms-surface)] text-center">
                  <div>
                    <strong className="block text-2xl font-semibold tracking-[-0.04em]">
                      {occupancyPercent}%
                    </strong>
                    <span className="text-[11px] text-[var(--vms-ink-muted)]">
                      Occupied
                    </span>
                  </div>
                </div>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--vms-success)]" />
                    Occupied
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {occupiedUnitIds.size}
                    <span className="ml-1.5 font-normal text-[var(--vms-ink-muted)]">
                      ({occupancyPercent}%)
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--vms-surface-subtle)] ring-1 ring-[var(--vms-line)]" />
                    Vacant
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {Math.max(0, units.length - occupiedUnitIds.size)}
                    <span className="ml-1.5 font-normal text-[var(--vms-ink-muted)]">
                      ({units.length ? 100 - occupancyPercent : 0}%)
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[var(--vms-line)] pt-3">
                  <dt className="font-semibold">Total units</dt>
                  <dd className="font-semibold tabular-nums">{units.length}</dd>
                </div>
              </dl>
            </div>
          )}
          <Link
            href="/admin/residential/units"
            className="inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
          >
            View units
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <UnitActivity
          rows={unitRows}
          loading={loading}
          maintenanceError={
            maintenance.isError
              ? parseApiError(maintenance.error).message
              : null
          }
          onRetry={() => maintenance.refetch()}
        />
        <RecentActivity
          entries={recentActivity}
          announcementsError={
            announcements.isError
              ? parseApiError(announcements.error).message
              : null
          }
          canManageVisitors={canManageVisitors}
        />
      </div>
    </ResidentialShell>
  );
}

function UnitActivity({
  rows,
  loading,
  maintenanceError,
  onRetry,
}: {
  rows: UnitActivityRow[];
  loading: boolean;
  maintenanceError: string | null;
  onRetry: () => void;
}) {
  const columns: Column<UnitActivityRow>[] = [
    {
      key: "name",
      header: "Unit",
      sortable: true,
      minWidth: 190,
      accessor: (row) => (
        <div>
          <strong className="block text-sm">{row.name}</strong>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {row.building}
          </span>
        </div>
      ),
    },
    {
      key: "residents",
      header: "Resident",
      sortable: true,
      minWidth: 180,
      accessor: (row) => (
        <span className="line-clamp-2 max-w-52 text-sm">{row.residents}</span>
      ),
    },
    {
      key: "occupancyStatus",
      header: "Occupancy",
      sortable: true,
      minWidth: 125,
      accessor: (row) => (
        <StatusBadge
          tone={row.occupancyStatus === "occupied" ? "success" : "neutral"}
        >
          {titleCase(row.occupancyStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      minWidth: 145,
      accessor: (row) => (
        <span
          className={
            row.balance
              ? "font-semibold tabular-nums text-[var(--vms-danger)]"
              : "tabular-nums text-[var(--vms-ink-muted)]"
          }
        >
          {row.balance || "No balance"}
        </span>
      ),
    },
    {
      key: "openRequests",
      header: "Open requests",
      sortable: true,
      minWidth: 120,
      accessor: (row) => (
        <span className="tabular-nums">
          {row.openRequests === null ? "—" : row.openRequests}
        </span>
      ),
      responsiveHide: "lg",
    },
    {
      key: "updatedAt",
      header: "Updated",
      sortable: true,
      minWidth: 145,
      accessor: (row) => (
        <span className="whitespace-nowrap text-xs text-[var(--vms-ink-muted)]">
          {relativeTime(row.updatedAt)}
        </span>
      ),
      responsiveHide: "xl",
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      minWidth: 88,
      accessor: (row) => (
        <Button asChild size="sm" variant="ghost">
          <Link
            href={`/admin/residential/units?unit=${row.id}`}
            aria-label={`Open ${row.name}`}
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      ),
    },
  ];
  return (
    <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--vms-line)] px-4 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            Unit activity
          </h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Current status, balances and requests by unit.
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/admin/residential/units">View all</Link>
        </Button>
      </div>
      {maintenanceError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--vms-line)] px-4 py-3 text-sm text-[var(--vms-danger)]"
        >
          <p>Request counts unavailable: {maintenanceError}</p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry maintenance
          </Button>
        </div>
      ) : null}
      <div className="p-3 sm:p-4">
        <DataTable
          data={rows.slice(0, 5)}
          columns={columns}
          tableLabel="Residential unit activity"
          searchable={false}
          showPagination={false}
          enableViewControls={false}
          isLoading={loading}
          emptyMessage="No units have been created at this property."
        />
      </div>
    </section>
  );
}

function RecentActivity({
  entries,
  announcementsError,
  canManageVisitors,
}: {
  entries: ActivityEntry[];
  announcementsError: string | null;
  canManageVisitors: boolean;
}) {
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
      <div className="border-b border-[var(--vms-line)] px-4 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          Recent activity
        </h2>
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
          Latest unit, household and operations updates.
        </p>
      </div>
      {entries.length ? (
        <ol className="space-y-0 px-4">
          {entries.map((entry, index) => {
            const Icon = entry.icon;
            const toneClass = {
              success:
                "bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
              info: "bg-[color-mix(in_srgb,var(--vms-info)_9%,white)] text-[var(--vms-info)]",
              warning:
                "bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]",
            }[entry.tone];
            return (
              <li
                key={entry.id}
                className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-4"
              >
                {index < entries.length - 1 ? (
                  <span
                    className="absolute bottom-0 left-[17px] top-12 w-px bg-[var(--vms-line)]"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={`relative z-10 grid h-9 w-9 place-items-center rounded-full ${toneClass}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm">{entry.title}</strong>
                    <time
                      dateTime={entry.occurredAt}
                      className="shrink-0 text-[11px] text-[var(--vms-ink-muted)]"
                    >
                      {relativeTime(entry.occurredAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                    {entry.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="p-5 text-sm text-[var(--vms-ink-muted)]">
          {announcementsError
            ? "No recent activity is available while announcements are offline."
            : "No recent residential activity has been recorded."}
        </div>
      )}
      <div className="flex flex-wrap gap-4 border-t border-[var(--vms-line)] px-4 py-3">
        <Link
          href="/admin/residential/maintenance"
          className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Maintenance
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {canManageVisitors ? (
          <Link
            href="/admin/invitations"
            className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
          >
            Visitor access
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function groupRelationships(relationships: WorkspaceRelationship[]) {
  const grouped = new Map<string, WorkspaceRelationship[]>();
  relationships.forEach((relationship) => {
    const current = grouped.get(relationship.place.id) || [];
    current.push(relationship);
    grouped.set(relationship.place.id, current);
  });
  return grouped;
}

function groupAssignments(assignments: Assignment[]) {
  const grouped = new Map<string, Assignment[]>();
  assignments.forEach((assignment) => {
    const current = grouped.get(assignment.target_place.id) || [];
    current.push(assignment);
    grouped.set(assignment.target_place.id, current);
  });
  return grouped;
}

function formatAssignmentBalances(assignments: Assignment[]): string | null {
  const balances = new Map<string, number>();
  for (const assignment of assignments) {
    const amount = Number(assignment.outstanding_amount || 0);
    if (!(amount > 0)) continue;
    const currency = assignment.charge_definition.currency.toUpperCase();
    balances.set(currency, (balances.get(currency) || 0) + amount);
  }
  if (!balances.size) return null;
  return [...balances]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => formatMoneyWithCode(amount, currency))
    .join(" · ");
}

function groupMaintenance(requests: MaintenanceRequest[]) {
  const grouped = new Map<string, MaintenanceRequest[]>();
  requests.forEach((request) => {
    const current = grouped.get(request.place.id) || [];
    current.push(request);
    grouped.set(request.place.id, current);
  });
  return grouped;
}

function parentName(
  places: Array<{ id: string; name: string }>,
  parentId: string | null,
) {
  if (!parentId) return "Site root";
  return places.find((place) => place.id === parentId)?.name || "Unassigned";
}

function buildRecentActivity({
  relationships,
  maintenance,
  announcements,
}: {
  relationships: WorkspaceRelationship[];
  maintenance: MaintenanceRequest[];
  announcements: Announcement[];
}): ActivityEntry[] {
  const relationshipEntries: ActivityEntry[] = relationships.map(
    (relationship) => ({
      id: `relationship-${relationship.id}-${relationship.updated_at}`,
      icon: UserCheck,
      title:
        relationship.status === "pending"
          ? "Occupancy awaiting approval"
          : relationship.status === "active"
            ? "Occupancy recorded"
            : `Occupancy ${relationship.status}`,
      detail: `${relationship.party.display_name} · ${relationship.place.name}`,
      occurredAt: relationship.updated_at,
      tone: relationship.status === "pending" ? "warning" : "success",
    }),
  );
  const maintenanceEntries: ActivityEntry[] = maintenance.map((request) => ({
    id: `maintenance-${request.id}-${request.updated_at}`,
    icon: Wrench,
    title: "Maintenance request updated",
    detail: `${request.title} · ${request.place.name} · ${titleCase(request.status)}`,
    occurredAt: request.updated_at,
    tone: request.priority === "urgent" ? "warning" : "info",
  }));
  const announcementEntries: ActivityEntry[] = announcements
    .filter((announcement) => announcement.published_at)
    .map((announcement) => ({
      id: `announcement-${announcement.id}`,
      icon: Megaphone,
      title: "Announcement published",
      detail: announcement.title,
      occurredAt: announcement.published_at!,
      tone: "info",
    }));
  const entries: ActivityEntry[] = [
    ...relationshipEntries,
    ...maintenanceEntries,
    ...announcementEntries,
  ];
  return entries
    .filter((entry) => Number.isFinite(Date.parse(entry.occurredAt)))
    .sort(
      (left, right) =>
        Date.parse(right.occurredAt) - Date.parse(left.occurredAt),
    )
    .slice(0, 6);
}

function relativeTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const days = differenceInCalendarDays(new Date(), date);
  if (days === 0) return `Today, ${format(date, "HH:mm")}`;
  if (days === 1) return `Yesterday, ${format(date, "HH:mm")}`;
  return formatDistanceToNowStrict(date, { addSuffix: true });
}
