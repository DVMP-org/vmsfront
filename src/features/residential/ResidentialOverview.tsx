"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  DoorOpen,
  Home,
  Megaphone,
  RefreshCw,
  ReceiptText,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";

import { ActionCard } from "@/components/ui/ActionCard";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";
import {
  maintenanceStatuses,
  titleCase,
  type MaintenanceRequest,
} from "./contracts";

export default function ResidentialOverview() {
  const { selectedProperty, contextKey } = useResidentialAccess();
  const placeId = selectedProperty?.id || "";
  const tree = useQuery({
    queryKey: ["residential", contextKey, "tree"],
    queryFn: residentialApi.tree,
    enabled: !!placeId,
  });
  const scopeIds = tree.data
    ? descendantIds(tree.data, placeId)
    : new Set<string>();
  const units = tree.data
    ? flattenPlaces(tree.data).filter(
        (place) => scopeIds.has(place.id) && place.kind === "unit",
      )
    : [];
  const relationships = useQuery({
    queryKey: ["residential", contextKey, "relationships", placeId],
    queryFn: () => residentialApi.relationships({ status: "active" }),
    enabled: !!placeId,
  });
  const maintenance = useQuery({
    queryKey: ["residential", contextKey, "maintenance", placeId, "overview"],
    queryFn: () => residentialApi.maintenance({}),
    enabled: !!placeId,
    retry: false,
  });

  const scopedRelationships = (relationships.data?.items || []).filter((row) =>
    scopeIds.has(row.place.id),
  );
  const occupiedUnitIds = new Set(
    scopedRelationships
      .filter((row) =>
        ["resident", "tenant", "owner", "household_member"].includes(row.role),
      )
      .map((row) => row.place.id),
  );
  const openMaintenance = (maintenance.data?.items || []).filter(
    (request) => !["resolved", "closed"].includes(request.status),
  );
  const renewals = scopedRelationships.filter((relationship) => {
    if (!relationship.effective_to) return false;
    const days = differenceInCalendarDays(
      new Date(relationship.effective_to),
      new Date(),
    );
    return days >= 0 && days <= 60;
  });
  const loading =
    tree.isPending || relationships.isPending || maintenance.isPending;
  const hasLoadError =
    tree.isError || relationships.isError || maintenance.isError;

  return (
    <ResidentialShell
      title="Residential overview"
      description="Households, occupancy, rent, requests and resident communication for the selected property."
      primaryAction={
        <Button asChild>
          <Link href="/admin/residential/units">
            Open unit register
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      }
    >
      <section
        aria-label="Residential operating summary"
        className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric
          icon={Home}
          label="Units"
          value={loading ? "—" : String(units.length)}
          detail={`${occupiedUnitIds.size} with an active household`}
        />
        <Metric
          icon={UsersRound}
          label="Active relationships"
          value={loading ? "—" : String(scopedRelationships.length)}
          detail="Residents, owners, tenants and household members"
        />
        <Metric
          icon={Wrench}
          label="Open requests"
          value={maintenance.isPending ? "—" : String(openMaintenance.length)}
          detail={
            maintenance.isError
              ? "Maintenance unavailable"
              : "Open, triaged or in progress"
          }
        />
        <Metric
          icon={CalendarClock}
          label="Renewals due"
          value={loading ? "—" : String(renewals.length)}
          detail="Lease or occupancy ends within 60 days"
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
                maintenance.refetch(),
              ]);
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry all
          </Button>
        </section>
      ) : null}

      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold">Operating workflows</h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            The residential module keeps shared access and billing connected to
            each unit and household.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            title="Households & leases"
            description="Assign residents, owners and tenants, track start and end dates, and end stale occupancy."
            icon={UsersRound}
            href="/admin/residential/occupancies"
            eyebrow="Occupancy"
            tone="ink"
          />
          <ActionCard
            title="Rent & service charges"
            description="Review charge assignments and schedules by property, then continue to definitions and payments."
            icon={ReceiptText}
            href="/admin/residential/finance"
            eyebrow="Finance"
            tone="info"
          />
          <ActionCard
            title="Maintenance queue"
            description="Capture unit-linked issues, prioritise them and move work through resolution."
            icon={Wrench}
            href="/admin/residential/maintenance"
            eyebrow="Maintenance"
            tone="warning"
          />
          <ActionCard
            title="Resident announcements"
            description="Publish targeted notices to residents, owners, tenants or staff and track drafts."
            icon={Megaphone}
            href="/admin/residential/announcements"
            eyebrow="Communication"
            tone="coral"
          />
          <ActionCard
            title="Visitor invitations"
            description="Use the shared invitation and checkpoint workflows for resident visitor access."
            icon={DoorOpen}
            href="/admin/invitations"
            eyebrow="Access"
            tone="ink"
          />
          <ActionCard
            title="People directory"
            description="Inspect property administration separately from residential household relationships."
            icon={UsersRound}
            href="/admin/people"
            eyebrow="Directory"
            tone="info"
          />
        </div>
      </section>

      <WorkQueue
        requests={openMaintenance}
        isLoading={maintenance.isPending}
        error={
          maintenance.isError ? parseApiError(maintenance.error).message : null
        }
        onRetry={() => maintenance.refetch()}
      />
    </ResidentialShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
        <Icon className="h-4 w-4 text-[var(--vms-coral)]" aria-hidden />
        {label}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
        {detail}
      </p>
    </div>
  );
}

function WorkQueue({
  requests,
  isLoading,
  error,
  onRetry,
}: {
  requests: MaintenanceRequest[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "title",
      header: "Request",
      sortable: true,
      accessor: (request) => (
        <span>
          <Link
            href={`/admin/residential/maintenance?request=${request.id}`}
            className="font-semibold underline-offset-4 hover:underline"
          >
            {request.title}
          </Link>
          <span className="mt-1 block text-xs text-[var(--vms-ink-muted)]">
            {request.place.name} · {titleCase(request.category)}
          </span>
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      accessor: (request) => (
        <StatusBadge tone={priorityTone(request.priority)}>
          {titleCase(request.priority)}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (request) => (
        <StatusBadge tone={maintenanceTone(request.status)}>
          {titleCase(request.status)}
        </StatusBadge>
      ),
    },
    {
      key: "due_at",
      header: "Due",
      accessor: (request) =>
        request.due_at ? format(new Date(request.due_at), "d MMM yyyy") : "—",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--vms-line)] px-4 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            Maintenance attention
          </h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Unresolved requests for the selected property hierarchy.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/residential/maintenance">View all</Link>
        </Button>
      </div>
      {error && requests.length === 0 ? (
        <div role="alert" className="p-5 text-sm text-[var(--vms-danger)]">
          <p>{error}</p>
          <Button className="mt-3" variant="outline" onClick={onRetry}>
            Retry maintenance
          </Button>
        </div>
      ) : (
        <div className="p-3 sm:p-4">
          <DataTable
            data={requests.slice(0, 8)}
            columns={columns}
            isLoading={isLoading}
            pageSize={8}
            showPagination={false}
            emptyMessage="No unresolved maintenance requests."
            tableLabel="Open residential maintenance requests"
            mobileSummary={(request) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <strong>{request.title}</strong>
                  <StatusBadge tone={priorityTone(request.priority)}>
                    {titleCase(request.priority)}
                  </StatusBadge>
                </div>
                <p className="text-xs text-[var(--vms-ink-muted)]">
                  {request.place.name} · {titleCase(request.status)}
                </p>
              </div>
            )}
          />
        </div>
      )}
    </section>
  );
}

export function maintenanceTone(status: string): StatusTone {
  if (status === "resolved" || status === "closed") return "success";
  if (status === "in_progress" || status === "assigned") return "info";
  if (status === "triaged") return "warning";
  return maintenanceStatuses.includes(status as never) ? "danger" : "neutral";
}

export function priorityTone(priority: string): StatusTone {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  if (priority === "normal") return "info";
  return "neutral";
}
