"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ClipboardList,
  DoorOpen,
  KeyRound,
  ReceiptText,
  RefreshCw,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { format } from "date-fns/format";

import { ActionCard } from "@/components/ui/ActionCard";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import { CommercialShell, useCommercialAccess } from "./CommercialShell";
import {
  commercialApi,
  descendantIds,
  flattenPlaces,
  isCommercialInventory,
} from "./api";
import { titleCase } from "./contracts";

type LeaseAttention = {
  id: string;
  tenant: string;
  space: string;
  role: string;
  ends_at: string | null;
  days: number | null;
  state: "current" | "expired" | "expiring" | "open_ended";
};

export default function CommercialOverview() {
  const { selectedProperty, contextKey } = useCommercialAccess();
  const placeId = selectedProperty?.id || "";
  const tree = useQuery({
    queryKey: ["commercial", contextKey, "tree"],
    queryFn: commercialApi.tree,
    enabled: !!placeId,
  });
  const relationships = useQuery({
    queryKey: ["commercial", contextKey, "relationships", placeId],
    queryFn: () => commercialApi.relationships({ status: "active" }),
    enabled: !!placeId,
  });
  const assignments = useQuery({
    queryKey: ["commercial", contextKey, "charges", placeId],
    queryFn: commercialApi.chargeAssignments,
    enabled: !!placeId,
  });
  const maintenance = useQuery({
    queryKey: ["commercial", contextKey, "maintenance", placeId, "overview"],
    queryFn: () => commercialApi.maintenance({}),
    enabled: !!placeId,
    retry: false,
  });
  const places = tree.data ? flattenPlaces(tree.data) : [];
  const scopeIds = tree.data
    ? descendantIds(tree.data, placeId)
    : new Set<string>();
  const inventory = places.filter(
    (place) => scopeIds.has(place.id) && isCommercialInventory(place),
  );
  const scopedRelationships = (relationships.data?.items || []).filter((row) =>
    scopeIds.has(row.place.id),
  );
  const tenants = scopedRelationships.filter((row) =>
    ["tenant", "member"].includes(row.role),
  );
  const accessTeam = scopedRelationships.filter((row) =>
    ["employee", "contractor"].includes(row.role),
  );
  const leases = buildLeaseAttention(tenants);
  const leaseAttention = leases.filter(
    (lease) => lease.state === "expired" || lease.state === "expiring",
  );
  const assignmentsInScope = (assignments.data || []).filter((assignment) =>
    scopeIds.has(assignment.target_place.id),
  );
  const outstanding = assignmentsInScope.filter(
    (assignment) => Number(assignment.outstanding_amount || 0) > 0,
  ).length;
  const openMaintenance = (maintenance.data?.items || []).filter(
    (request) => !["resolved", "closed"].includes(request.status),
  );
  const loading =
    tree.isPending ||
    relationships.isPending ||
    assignments.isPending ||
    maintenance.isPending;
  const errors = [
    tree.isError ? tree.error : null,
    relationships.isError ? relationships.error : null,
    assignments.isError ? assignments.error : null,
    maintenance.isError ? maintenance.error : null,
  ].filter(Boolean);
  const columns: Column<LeaseAttention>[] = [
    {
      key: "tenant",
      header: "Business tenant",
      sortable: true,
      accessor: (lease) => (
        <div>
          <strong className="block">{lease.tenant}</strong>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {titleCase(lease.role)}
          </span>
        </div>
      ),
    },
    {
      key: "space",
      header: "Space",
      sortable: true,
      accessor: (lease) => lease.space,
    },
    {
      key: "state",
      header: "Lease state",
      sortable: true,
      accessor: (lease) => (
        <StatusBadge tone={leaseTone(lease.state)}>
          {titleCase(lease.state)}
        </StatusBadge>
      ),
    },
    {
      key: "ends_at",
      header: "Expiry",
      sortable: true,
      accessor: (lease) =>
        lease.ends_at
          ? `${format(new Date(lease.ends_at), "d MMM yyyy")} · ${
              lease.days === null
                ? ""
                : `${Math.abs(lease.days)}d ${lease.days < 0 ? "ago" : "left"}`
            }`
          : "Open ended",
    },
  ];

  return (
    <CommercialShell
      title="Commercial overview"
      description="Office and retail inventory, business tenancy, lease expiry, collections and operational access for the selected property."
      primaryAction={
        <Button asChild>
          <Link href="/admin/commercial/inventory">
            Open inventory
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      }
    >
      <section
        aria-label="Commercial operating summary"
        className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric
          icon={Building2}
          label="Commercial spaces"
          value={loading ? "—" : String(inventory.length)}
          detail={`${new Set(tenants.map((row) => row.place.id)).size} occupied`}
        />
        <Metric
          icon={BriefcaseBusiness}
          label="Business tenants"
          value={loading ? "—" : String(tenants.length)}
          detail="Active tenant and member relationships"
        />
        <Metric
          icon={CalendarClock}
          label="Lease attention"
          value={loading ? "—" : String(leaseAttention.length)}
          detail="Expired or ending within 60 days"
        />
        <Metric
          icon={WalletCards}
          label="Collections"
          value={assignments.isPending ? "—" : String(outstanding)}
          detail={
            assignments.isError
              ? "Charge assignments unavailable"
              : "Assignments with an outstanding balance"
          }
        />
      </section>

      {errors.length ? (
        <section
          role="status"
          className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-4 text-sm text-[var(--vms-warning)] sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Some commercial data could not be refreshed. Available sections
            remain usable.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void Promise.all([
                tree.refetch(),
                relationships.refetch(),
                assignments.refetch(),
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
          <h2 className="text-base font-semibold">Commercial workflows</h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Shared finance and access stay connected to each commercial space
            and tenant relationship.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            title="Office & shop inventory"
            description="Create, classify and archive offices, shops, retail units and warehouse spaces."
            icon={Building2}
            href="/admin/commercial/inventory"
            eyebrow="Inventory"
            tone="ink"
          />
          <ActionCard
            title="Business tenants & leases"
            description="Assign organizations and members to spaces, track lease periods and surface expiry."
            icon={BriefcaseBusiness}
            href="/admin/commercial/tenants"
            eyebrow="Tenancy"
            tone="info"
          />
          <ActionCard
            title="Rent & service charges"
            description="Review canonical charge assignments, responsible parties, balances and payment records."
            icon={ReceiptText}
            href="/admin/commercial/finance"
            eyebrow="Finance"
            tone="warning"
          />
          <ActionCard
            title="Staff & contractor access"
            description="Track employees and contractors with time-bounded access to a commercial property or space."
            icon={KeyRound}
            href="/admin/commercial/access"
            eyebrow="Access"
            tone="coral"
          />
          <ActionCard
            title="Visitor invitations"
            description="Use the shared invitation and checkpoint workflows for office visitors and contractors."
            icon={DoorOpen}
            href="/admin/invitations"
            eyebrow="Reception"
            tone="ink"
          />
          <ActionCard
            title="Commercial maintenance"
            description="Capture property and space issues with priority, assignment and resolution tracking."
            icon={ClipboardList}
            href="/admin/commercial/maintenance"
            eyebrow="Maintenance"
            tone="info"
          />
        </div>
      </section>

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <div className="mb-3 border-b border-[var(--vms-line)] pb-4">
          <h2 className="text-base font-semibold">Lease attention</h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Expiry is derived from the business tenant relationship’s effective
            end date.
          </p>
        </div>
        <DataTable
          data={leaseAttention}
          columns={columns}
          tableLabel="Commercial lease attention"
          searchable
          searchPlaceholder="Search tenants or spaces"
          isLoading={tree.isPending || relationships.isPending}
          errorMessage={
            tree.isError || relationships.isError
              ? parseApiError(tree.error || relationships.error).message
              : null
          }
          onRetry={() => {
            void tree.refetch();
            void relationships.refetch();
          }}
          emptyMessage="No leases expire in the next 60 days."
          mobileSummary={(lease) => (
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong>{lease.tenant}</strong>
                <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                  {lease.space} ·{" "}
                  {lease.ends_at
                    ? format(new Date(lease.ends_at), "d MMM yyyy")
                    : "Open ended"}
                </p>
              </div>
              <StatusBadge tone={leaseTone(lease.state)}>
                {titleCase(lease.state)}
              </StatusBadge>
            </div>
          )}
        />
      </section>

      {maintenance.isError ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <div className="flex items-start gap-3">
            <TriangleAlert
              className="mt-0.5 h-5 w-5 text-[var(--vms-warning)]"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold">Commercial maintenance API</h2>
              <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                The shared maintenance register is ready for the typed
                commercial endpoint. It currently reports unavailable instead of
                showing a false zero.
              </p>
              <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                {parseApiError(maintenance.error).message}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <p className="text-xs text-[var(--vms-ink-muted)]">
          {openMaintenance.length} open commercial maintenance request
          {openMaintenance.length === 1 ? "" : "s"}.
        </p>
      )}
    </CommercialShell>
  );
}

function buildLeaseAttention(
  relationships: Array<{
    id: string;
    role: string;
    effective_to: string | null;
    party: { display_name: string };
    place: { id: string; name: string };
  }>,
): LeaseAttention[] {
  return relationships.map((relationship) => {
    const days = relationship.effective_to
      ? differenceInCalendarDays(
          new Date(relationship.effective_to),
          new Date(),
        )
      : null;
    return {
      id: relationship.id,
      tenant: relationship.party.display_name,
      space: relationship.place.name,
      role: relationship.role,
      ends_at: relationship.effective_to,
      days,
      state:
        days === null
          ? "open_ended"
          : days < 0
            ? "expired"
            : days <= 60
              ? "expiring"
              : "current",
    };
  });
}

export function leaseTone(state: LeaseAttention["state"]): StatusTone {
  return state === "expired"
    ? "danger"
    : state === "expiring"
      ? "warning"
      : "success";
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
