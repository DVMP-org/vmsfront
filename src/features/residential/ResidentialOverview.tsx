"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Building2,
  Clock3,
  Home,
  Megaphone,
  Plus,
  ReceiptText,
  RefreshCw,
  UserCheck,
  UsersRound,
  WalletCards,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
} from "date-fns";

import { MetricCard } from "@/components/ui/MetricCard";
import { Button, buttonVariants } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import type { Assignment } from "@/features/charges/api";
import {
  maintenanceApi,
  type MaintenanceRequest,
} from "@/features/maintenance/api";
import type { WorkspaceRelationship } from "@/types";
import { parseApiError } from "@/lib/error-utils";
import { formatCurrency } from "@/lib/utils";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";
import { titleCase, type Announcement } from "./contracts";

const occupancyRoles = ["resident", "owner", "tenant", "household_member"];

interface UnitActivityRow {
  id: string;
  name: string;
  building: string;
  residents: string;
  occupancyStatus: "occupied" | "vacant";
  balance: number;
  openRequests: number;
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
  const { selectedProperty, contextKey, canManageUnits, canManageVisitors } =
    useResidentialAccess();
  const placeId = selectedProperty?.id || "";
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
    (row) => row.status === "active" && occupancyRoles.includes(row.role),
  );
  const pendingRelationships = scopedRelationships.filter(
    (row) => row.status === "pending",
  );
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
  const totalChargesDue = outstandingAssignments.reduce(
    (total, assignment) => total + Number(assignment.outstanding_amount || 0),
    0,
  );
  const overdueAssignments = outstandingAssignments.filter(
    (assignment) =>
      !!assignment.next_due_date &&
      new Date(assignment.next_due_date).getTime() < Date.now(),
  );
  const openMaintenance = (maintenance.data?.items || []).filter(
    (request) => !["resolved", "closed"].includes(request.status),
  );
  const urgentMaintenance = openMaintenance.filter((request) =>
    ["high", "urgent"].includes(request.priority),
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
      balance: unitAssignments.reduce(
        (total, assignment) =>
          total + Number(assignment.outstanding_amount || 0),
        0,
      ),
      openRequests: unitRequests.length,
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
  const occupancyPercent = units.length
    ? Math.round((occupiedUnitIds.size / units.length) * 100)
    : 0;
  const attentionTotal =
    overdueAssignments.length +
    pendingRelationships.length +
    urgentMaintenance.length;

  return (
    <ResidentialShell
      title="Residential overview"
      description={`Units, occupancy, finance and operations for ${selectedProperty?.name || "the selected property"}.`}
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
      <section
        aria-label="Residential operating summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          icon={Building2}
          label="Units"
          value={loading ? "—" : String(units.length)}
        />
        <MetricCard
          icon={UsersRound}
          label="Occupied"
          value={loading ? "—" : String(occupiedUnitIds.size)}
        />
        <MetricCard
          icon={WalletCards}
          label="Charges due"
          value={
            chargeAssignments.isPending
              ? "—"
              : chargeAssignments.isError
                ? "Unavailable"
                : formatCompactMoney(totalChargesDue)
          }
        />
        <MetricCard
          icon={Wrench}
          label="Open requests"
          value={maintenance.isPending ? "—" : String(openMaintenance.length)}
        />
      </section>

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

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,1fr)]">
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--vms-line)] px-4 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle
                  className="h-4 w-4 text-[var(--vms-warning)]"
                  aria-hidden="true"
                />
                Requires attention
              </h2>
              <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                Items that need your action to keep operations running smoothly.
              </p>
            </div>
            <Link
              href="/admin/residential/maintenance"
              className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold underline-offset-4 hover:underline"
            >
              View all ({attentionTotal}){" "}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid flex-1 divide-y divide-[var(--vms-line)]">
            <AttentionRow
              icon={ReceiptText}
              tone="danger"
              title="Overdue charges"
              detail={
                outstandingAssignments.length
                  ? `${overdueAssignments.length} assigned charges are past due · ${formatCurrency(totalChargesDue)} outstanding`
                  : "No assigned charge is currently overdue."
              }
              count={overdueAssignments.length}
              action={
                <Button asChild size="sm">
                  <Link href="/admin/residential/finance">Review charges</Link>
                </Button>
              }
            />
            <AttentionRow
              icon={UserCheck}
              tone="warning"
              title="Pending occupancy approval"
              detail={
                pendingRelationships.length
                  ? `${pendingRelationships.length} household relationship${pendingRelationships.length === 1 ? " is" : "s are"} awaiting review.`
                  : "No household relationship is awaiting review."
              }
              count={pendingRelationships.length}
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/residential/occupancies">
                    Review requests
                  </Link>
                </Button>
              }
            />
            <AttentionRow
              icon={Wrench}
              tone="info"
              title="Maintenance requests"
              detail={
                maintenance.isError
                  ? parseApiError(maintenance.error).message
                  : `${openMaintenance.length} open request${openMaintenance.length === 1 ? "" : "s"} · ${urgentMaintenance.length} high or urgent.`
              }
              count={openMaintenance.length}
              action={
                maintenance.isError ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => maintenance.refetch()}
                  >
                    Retry maintenance
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/residential/maintenance">
                      View requests
                    </Link>
                  </Button>
                )
              }
            />
          </div>
        </section>

        <section className="flex h-full flex-col rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                Occupancy breakdown
              </h2>
              <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                Current unit occupancy at{" "}
                {selectedProperty?.name || "this property"}.
              </p>
            </div>
          </div>
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

function AttentionRow({
  icon: Icon,
  tone,
  title,
  detail,
  count,
  action,
}: {
  icon: LucideIcon;
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  count: number;
  action: React.ReactNode;
}) {
  const toneClass = {
    danger: "bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]",
    warning: "bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]",
    info: "bg-[color-mix(in_srgb,var(--vms-info)_9%,white)] text-[var(--vms-info)]",
  }[tone];
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          <span className="rounded-full bg-[var(--vms-surface-subtle)] px-2 py-0.5 text-[11px] font-semibold tabular-nums">
            {count}
          </span>
        </div>
        <p className="mt-0.5 text-sm leading-5 text-[var(--vms-ink-muted)]">
          {detail}
        </p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">{action}</div>
    </div>
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
      accessor: (row) => (
        <span className="line-clamp-2 max-w-52 text-sm">{row.residents}</span>
      ),
    },
    {
      key: "occupancyStatus",
      header: "Occupancy",
      sortable: true,
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
      sortable: true,
      accessor: (row) => (
        <span
          className={
            row.balance > 0
              ? "font-semibold tabular-nums text-[var(--vms-danger)]"
              : "tabular-nums text-[var(--vms-ink-muted)]"
          }
        >
          {row.balance > 0 ? formatCurrency(row.balance) : "No balance"}
        </span>
      ),
    },
    {
      key: "openRequests",
      header: "Open requests",
      sortable: true,
      accessor: (row) => (
        <span className="tabular-nums">{row.openRequests}</span>
      ),
      responsiveHide: "lg",
    },
    {
      key: "updatedAt",
      header: "Updated",
      sortable: true,
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
      {maintenanceError && !rows.length ? (
        <div role="alert" className="p-5 text-sm text-[var(--vms-danger)]">
          <p>{maintenanceError}</p>
          <Button className="mt-3" variant="outline" onClick={onRetry}>
            Retry maintenance
          </Button>
        </div>
      ) : (
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
      )}
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

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function priorityTone(priority: string): StatusTone {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  if (priority === "normal") return "info";
  return "neutral";
}
