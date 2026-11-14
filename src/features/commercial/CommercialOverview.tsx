"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ClipboardList,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  UserRoundPlus,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns/format";

import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";

import { CommercialShell, useCommercialAccess } from "./CommercialShell";
import { descendantIds, flattenPlaces, isCommercialInventory } from "./api";
import { titleCase } from "./contracts";
import {
  useCommercialChargeAssignments,
  useCommercialContractors,
  useCommercialMaintenance,
  useCommercialRelationships,
  useCommercialTree,
} from "./queries";
import {
  buildLeaseAttention,
  buildOccupancy,
  expiryBuckets,
  leaseTone,
  type LeaseAttention,
} from "./lib";

export default function CommercialOverview() {
  const { selectedSite, contextKey } = useCommercialAccess();
  const placeId = selectedSite?.id || "";
  const enabled = Boolean(placeId);

  const tree = useCommercialTree(contextKey, enabled);
  const relationships = useCommercialRelationships(contextKey, enabled);
  const assignments = useCommercialChargeAssignments(contextKey, enabled);
  const maintenance = useCommercialMaintenance(contextKey, enabled);
  const contractors = useCommercialContractors(contextKey, selectedSite?.id);

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
  const leases = buildLeaseAttention(tenants);
  const leaseAttention = leases.filter(
    (lease) => lease.state === "expired" || lease.state === "expiring",
  );

  const assignmentsInScope = (assignments.data || []).filter((assignment) =>
    scopeIds.has(assignment.target_place.id),
  );
  const outstandingAssignments = assignmentsInScope
    .filter((assignment) => Number(assignment.outstanding_amount || 0) > 0)
    .sort(
      (left, right) =>
        Number(right.outstanding_amount) - Number(left.outstanding_amount),
    );
  const currency = outstandingAssignments[0]?.charge_definition.currency;
  const openBalance = outstandingAssignments.reduce(
    (total, assignment) => total + Number(assignment.outstanding_amount || 0),
    0,
  );

  const occupancy = buildOccupancy(inventory, places, scopedRelationships);
  const occupiedCount = occupancy.reduce((sum, row) => sum + row.occupied, 0);
  const occupancyRate = inventory.length
    ? Math.round((occupiedCount / inventory.length) * 100)
    : 0;

  const maintenanceRows = maintenance.data?.items ?? [];
  const openWorkOrders = maintenanceRows.filter(
    (request) => !["resolved", "closed"].includes(request.status),
  );
  const overdueWorkOrders = openWorkOrders.filter(
    (request) => request.due_at && new Date(request.due_at) < new Date(),
  );

  const contractorRows = contractors.data?.items ?? [];
  const activeContractors = contractorRows.filter(
    (contractor) => contractor.status === "active",
  );
  const contractorWatch = contractorRows.filter((contractor) => {
    if (contractor.status === "revoked") return false;
    const permitExpired =
      contractor.requires_permit &&
      contractor.permit_expires_at !== null &&
      new Date(contractor.permit_expires_at).getTime() < Date.now();
    const windowEnding =
      new Date(contractor.access_to).getTime() - Date.now() < 7 * 86_400_000;
    return permitExpired || windowEnding;
  });

  const errors = [
    tree.isError ? tree.error : null,
    relationships.isError ? relationships.error : null,
    assignments.isError ? assignments.error : null,
    maintenance.isError ? maintenance.error : null,
    contractors.isError ? contractors.error : null,
  ].filter(Boolean);

  const leaseColumns: Column<LeaseAttention>[] = [
    {
      key: "tenant",
      header: "Tenant",
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
      description="Occupancy, lease expiry, collections, maintenance and contractor access for the selected property."
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
          label="Spaces"
          value={tree.isPending ? "—" : `${occupiedCount}/${inventory.length}`}
          detail={`${occupancyRate}% occupied`}
        />
        <Metric
          icon={BriefcaseBusiness}
          label="Tenants"
          value={relationships.isPending ? "—" : String(tenants.length)}
          detail={`${leases.length} active agreements`}
        />
        <Metric
          icon={WalletCards}
          label="Outstanding"
          value={
            assignments.isPending
              ? "—"
              : formatMoney(openBalance, currency)
          }
          detail={`${outstandingAssignments.length} assignments in arrears`}
          attention={outstandingAssignments.length > 0}
        />
        <Metric
          icon={ClipboardList}
          label="Work orders"
          value={maintenance.isPending ? "—" : String(openWorkOrders.length)}
          detail={
            overdueWorkOrders.length
              ? `${overdueWorkOrders.length} past their due date`
              : "Nothing overdue"
          }
          attention={overdueWorkOrders.length > 0}
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
                contractors.refetch(),
              ]);
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry all
          </Button>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Occupancy by building"
          description="Occupied spaces against everything currently lettable."
          action={{ href: "/admin/commercial/inventory", label: "Inventory" }}
        >
          {tree.isPending || relationships.isPending ? (
            <PanelSkeleton rows={3} />
          ) : occupancy.length ? (
            <ul className="space-y-3">
              {occupancy.map((row) => {
                const rate = row.total ? (row.occupied / row.total) * 100 : 0;
                return (
                  <li key={row.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">
                        {row.label}
                        {row.standalone ? (
                          <span className="ml-1.5 text-xs font-normal text-[var(--vms-ink-muted)]">
                            standalone
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 tabular-nums text-[var(--vms-ink-muted)]">
                        {row.occupied}/{row.total} · {Math.round(rate)}%
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--vms-surface-subtle)]"
                      role="img"
                      aria-label={`${row.label}: ${Math.round(rate)}% occupied`}
                    >
                      <span
                        className="block h-full rounded-full bg-[var(--vms-action)]"
                        style={{ width: `${Math.max(rate, 2)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyRow
              message="No lettable spaces yet. Add inventory to see occupancy."
              href="/admin/commercial/inventory"
              label="Add spaces"
            />
          )}
        </Panel>

        <Panel
          title="Lease expiry"
          description="Where tenancy needs a decision next."
          action={{ href: "/admin/commercial/tenants", label: "Parties" }}
        >
          {relationships.isPending ? (
            <PanelSkeleton rows={4} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {expiryBuckets(leases).map((bucket) => (
                <div
                  key={bucket.key}
                  className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                    {bucket.label}
                  </p>
                  <p
                    className={
                      bucket.danger && bucket.count > 0
                        ? "mt-1 text-2xl font-semibold tabular-nums text-[var(--vms-danger)]"
                        : "mt-1 text-2xl font-semibold tabular-nums"
                    }
                  >
                    {bucket.count}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Arrears"
          description="Largest outstanding balances in this property."
          action={{ href: "/admin/commercial/finance", label: "Collections" }}
        >
          {assignments.isPending ? (
            <PanelSkeleton rows={3} />
          ) : outstandingAssignments.length ? (
            <ul className="divide-y divide-[var(--vms-line)]">
              {outstandingAssignments.slice(0, 5).map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/charges/assignments/${assignment.id}`}
                      className="block truncate text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      {assignment.charge_definition.name}
                    </Link>
                    <p className="truncate text-xs text-[var(--vms-ink-muted)]">
                      {assignment.target_place.name}
                      {assignment.current_responsibility?.responsible_party
                        ?.display_name
                        ? ` · ${assignment.current_responsibility.responsible_party.display_name}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--vms-warning)]">
                    {formatMoney(
                      assignment.outstanding_amount,
                      assignment.charge_definition.currency,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow message="No outstanding balances." />
          )}
        </Panel>

        <Panel
          title="Maintenance"
          description="Work orders from the shared maintenance register."
          action={{
            href: "/admin/commercial/maintenance",
            label: "Work orders",
          }}
        >
          {maintenance.isPending ? (
            <PanelSkeleton rows={3} />
          ) : maintenance.isError ? (
            <p className="text-sm text-[var(--vms-ink-muted)]">
              Work orders could not be loaded.{" "}
              <button
                type="button"
                onClick={() => void maintenance.refetch()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </p>
          ) : openWorkOrders.length ? (
            <ul className="divide-y divide-[var(--vms-line)]">
              {openWorkOrders.slice(0, 5).map((request) => (
                <li
                  key={request.id}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {request.title}
                    </p>
                    <p className="truncate text-xs text-[var(--vms-ink-muted)]">
                      {request.place.name} · {titleCase(request.priority)}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      request.due_at && new Date(request.due_at) < new Date()
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {titleCase(request.status)}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow message="No open work orders." />
          )}
        </Panel>
      </div>

      <Panel
        title="Contractor access"
        description="Site-registered contractors inside their window, and the ones about to leave it."
        action={{ href: "/admin/contractors", label: "Contractors" }}
      >
        {contractors.isPending ? (
          <PanelSkeleton rows={2} />
        ) : contractors.isError ? (
          <p className="text-sm text-[var(--vms-ink-muted)]">
            Contractor access could not be loaded.{" "}
            <button
              type="button"
              onClick={() => void contractors.refetch()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </p>
        ) : contractorRows.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="On Site now" value={activeContractors.length} />
            <Stat
              label="Ending or permit expiring"
              value={contractorWatch.length}
              attention={contractorWatch.length > 0}
            />
            <Stat
              label="Under permit"
              value={contractorRows.filter((item) => item.requires_permit).length}
            />
          </div>
        ) : (
          <EmptyRow
            message="No contractors registered for this Site."
            href="/admin/contractors"
            label="Register one"
          />
        )}
      </Panel>

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <div className="mb-3 border-b border-[var(--vms-line)] pb-4">
          <h2 className="text-base font-semibold">Lease attention</h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Expiry is derived from the tenant relationship’s effective end date.
          </p>
        </div>
        <DataTable
          data={leaseAttention}
          columns={leaseColumns}
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

      <section
        aria-label="Commercial quick actions"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <QuickAction
          icon={Building2}
          label="Add a space"
          href="/admin/commercial/inventory"
        />
        <QuickAction
          icon={BriefcaseBusiness}
          label="Add a party"
          href="/admin/commercial/tenants"
        />
        <QuickAction
          icon={ShieldCheck}
          label="Register contractor"
          href="/admin/contractors"
        />
        <QuickAction
          icon={ReceiptText}
          label="Create a charge"
          href="/admin/charges/new"
        />
      </section>
    </CommercialShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  attention = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  attention?: boolean;
}) {
  return (
    <div className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
      <p
        className={
          attention
            ? "mt-0.5 text-xs font-medium text-[var(--vms-warning)]"
            : "mt-0.5 text-xs text-[var(--vms-ink-muted)]"
        }
      >
        {detail}
      </p>
    </div>
  );
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-[var(--vms-ink-muted)]">
            {description}
          </p>
        </div>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-[var(--vms-radius-control)] px-1 text-xs font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2"
          >
            {action.label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <div role="status" aria-label="Loading panel" className="space-y-2.5">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-8 animate-pulse rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

function EmptyRow({
  message,
  href,
  label,
}: {
  message: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] px-3 py-3 text-sm text-[var(--vms-ink-muted)]">
      <span>{message}</span>
      {href && label ? (
        <Link
          href={href}
          className="text-xs font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
        >
          {label}
        </Link>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  attention = false,
}: {
  label: string;
  value: number;
  attention?: boolean;
}) {
  return (
    <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
        {label}
      </p>
      <p
        className={
          attention
            ? "mt-1 text-2xl font-semibold tabular-nums text-[var(--vms-warning)]"
            : "mt-1 text-2xl font-semibold tabular-nums"
        }
      >
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-14 items-center gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-4 text-sm font-semibold transition hover:border-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)] group-hover:bg-[var(--vms-surface)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {label}
      <ArrowRight
        className="ml-auto h-4 w-4 text-[var(--vms-ink-muted)]"
        aria-hidden="true"
      />
    </Link>
  );
}

function formatMoney(amount: unknown, currency?: string | null): string {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: currency ? "currency" : "decimal",
      currency: currency || undefined,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
}
