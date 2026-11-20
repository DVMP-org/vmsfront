"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { format } from "date-fns/format";

import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricStrip } from "@/features/dashboard/MetricStrip";
import { AttentionQueueSection } from "@/features/dashboard/AttentionQueueSection";
import {
  PanelState,
  ReportPanel,
  SeeAllLink,
} from "@/features/dashboard/DashboardPrimitives";
import { formatMoneyWithCode } from "@/lib/currency";
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
  const relationshipsComplete =
    !!relationships.data &&
    relationships.data.total <= relationships.data.items.length;
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
        (left.next_due_date ? Date.parse(left.next_due_date) : Infinity) -
          (right.next_due_date ? Date.parse(right.next_due_date) : Infinity) ||
        left.charge_definition.name.localeCompare(right.charge_definition.name),
    );
  const balancesByCurrency = new Map<string, number>();
  for (const assignment of outstandingAssignments) {
    const code = assignment.charge_definition.currency.toUpperCase();
    balancesByCurrency.set(
      code,
      (balancesByCurrency.get(code) ?? 0) +
        Number(assignment.outstanding_amount || 0),
    );
  }
  const outstandingLabel =
    [...balancesByCurrency]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([code, amount]) => formatMoneyWithCode(amount, code))
      .join(" · ") || "No balance due";

  const occupancy = buildOccupancy(inventory, places, scopedRelationships);
  const occupiedCount = occupancy.reduce((sum, row) => sum + row.occupied, 0);
  const occupancyRate =
    relationshipsComplete && inventory.length
      ? Math.round((occupiedCount / inventory.length) * 100)
      : null;

  const maintenanceRows = (maintenance.data?.items ?? []).filter((request) =>
    scopeIds.has(request.place.id),
  );
  const maintenanceComplete =
    !!maintenance.data &&
    maintenance.data.total <= maintenance.data.items.length;
  const openWorkOrders = maintenanceRows.filter(
    (request) => !["resolved", "closed"].includes(request.status),
  );
  const overdueWorkOrders = openWorkOrders.filter(
    (request) => request.due_at && new Date(request.due_at) < new Date(),
  );

  const contractorRows = (contractors.data?.items ?? []).filter(
    (contractor) => contractor.site_id === placeId,
  );
  const contractorsComplete =
    !!contractors.data &&
    contractors.data.total <= contractors.data.items.length;
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
      title="Overview"
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
      <MetricStrip
        label="Commercial operating summary"
        metrics={[
          {
            icon: Building2,
            label: "Spaces",
            value: `${relationshipsComplete ? "" : "≥"}${occupiedCount}/${inventory.length}`,
            detail: inventory.length
              ? occupancyRate === null
                ? "Known occupied spaces; full rate unavailable"
                : `${occupancyRate}% occupied`
              : "No lettable spaces configured",
            state:
              tree.isPending || relationships.isPending
                ? "loading"
                : tree.isError || relationships.isError
                  ? "error"
                  : "ready",
          },
          {
            icon: BriefcaseBusiness,
            label: "Tenancies",
            value: relationshipsComplete
              ? tenants.length
              : `≥${tenants.length}`,
            detail: relationshipsComplete
              ? `${leases.length} active relationships`
              : "Active relationships in loaded results",
            state:
              tree.isPending || relationships.isPending
                ? "loading"
                : tree.isError || relationships.isError
                  ? "error"
                  : "ready",
          },
          {
            icon: WalletCards,
            label: "Outstanding",
            value: outstandingLabel,
            detail: `${outstandingAssignments.length} assignments with a positive balance`,
            attention: outstandingAssignments.length > 0,
            state:
              tree.isPending || assignments.isPending
                ? "loading"
                : tree.isError || assignments.isError
                  ? "error"
                  : "ready",
          },
          {
            icon: ClipboardList,
            label: "Work orders",
            value: maintenanceComplete
              ? openWorkOrders.length
              : `≥${openWorkOrders.length}`,
            detail: overdueWorkOrders.length
              ? `${maintenanceComplete ? "" : "At least "}${overdueWorkOrders.length} past their due date`
              : "No overdue orders in loaded results",
            attention: overdueWorkOrders.length > 0,
            state:
              tree.isPending || maintenance.isPending
                ? "loading"
                : tree.isError || maintenance.isError
                  ? "error"
                  : "ready",
          },
        ]}
      />

      <AttentionQueueSection
        useCase="commercial"
        propertyName={selectedSite?.name || "this property"}
      />

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
        <ReportPanel
          title="Occupancy by building"
          description="Occupied spaces against everything currently lettable."
          action={
            <SeeAllLink href="/admin/commercial/inventory">
              Inventory
            </SeeAllLink>
          }
          bodyClassName="p-4 sm:p-5"
        >
          {tree.isPending || relationships.isPending ? (
            <PanelSkeleton rows={3} />
          ) : tree.isError || relationships.isError ? (
            <PanelState
              compact
              kind="error"
              title="Occupancy is unavailable"
              description="Space or tenancy data could not be loaded."
              onRetry={() => {
                void tree.refetch();
                void relationships.refetch();
              }}
            />
          ) : occupancy.length ? (
            <div>
              {!relationshipsComplete ? (
                <p
                  role="status"
                  className="mb-3 text-xs leading-5 text-[var(--vms-ink-muted)]"
                >
                  Active relationships are paginated. Occupied counts below are
                  lower bounds; full rates are unavailable.
                </p>
              ) : null}
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
                          {relationshipsComplete
                            ? row.occupied
                            : `≥${row.occupied}`}
                          /{row.total}
                          {relationshipsComplete
                            ? ` · ${Math.round(rate)}%`
                            : ""}
                        </span>
                      </div>
                      {relationshipsComplete ? (
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
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <EmptyRow
              message="No lettable spaces yet. Add inventory to see occupancy."
              href="/admin/commercial/inventory"
              label="Add spaces"
            />
          )}
        </ReportPanel>

        <ReportPanel
          title="Lease expiry"
          description="Where tenancy needs a decision next."
          action={
            <SeeAllLink href="/admin/commercial/tenants">Parties</SeeAllLink>
          }
          bodyClassName="p-4 sm:p-5"
        >
          {relationships.isPending ? (
            <PanelSkeleton rows={4} />
          ) : relationships.isError ? (
            <PanelState
              compact
              kind="error"
              title="Lease expiry is unavailable"
              description={parseApiError(relationships.error).message}
              onRetry={() => void relationships.refetch()}
            />
          ) : (
            <div>
              {!relationshipsComplete ? (
                <p
                  role="status"
                  className="mb-3 text-xs leading-5 text-[var(--vms-ink-muted)]"
                >
                  Counts below are lower bounds from the loaded active
                  relationships.
                </p>
              ) : null}
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
                      {relationshipsComplete
                        ? bucket.count
                        : `≥${bucket.count}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportPanel
          title="Outstanding charges"
          description="Positive assignment balances at this property, due dates first."
          action={
            <SeeAllLink href="/admin/commercial/finance">
              Collections
            </SeeAllLink>
          }
          bodyClassName="p-4 sm:p-5"
        >
          {tree.isPending || assignments.isPending ? (
            <PanelSkeleton rows={3} />
          ) : tree.isError || assignments.isError ? (
            <PanelState
              compact
              kind="error"
              title="Outstanding charges are unavailable"
              description={
                parseApiError(tree.error || assignments.error).message
              }
              onRetry={() => {
                void tree.refetch();
                void assignments.refetch();
              }}
            />
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
                    {formatMoneyWithCode(
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
        </ReportPanel>

        <ReportPanel
          title="Maintenance"
          description="Work orders from the shared maintenance register."
          action={
            <SeeAllLink href="/admin/commercial/maintenance">
              Work orders
            </SeeAllLink>
          }
          bodyClassName="p-4 sm:p-5"
        >
          {tree.isPending || maintenance.isPending ? (
            <PanelSkeleton rows={3} />
          ) : tree.isError || maintenance.isError ? (
            <PanelState
              compact
              kind="error"
              title="Work orders are unavailable"
              description={
                parseApiError(tree.error || maintenance.error).message
              }
              onRetry={() => {
                void tree.refetch();
                void maintenance.refetch();
              }}
            />
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
            <EmptyRow
              message={
                maintenanceComplete
                  ? "No open work orders."
                  : "No open work orders in the loaded results."
              }
            />
          )}
        </ReportPanel>
      </div>

      <ReportPanel
        title="Contractor access"
        description="Selected Site registrations and access or permit records needing attention."
        action={<SeeAllLink href="/admin/contractors">Contractors</SeeAllLink>}
        bodyClassName="p-4 sm:p-5"
      >
        {contractors.isPending ? (
          <PanelSkeleton rows={2} />
        ) : contractors.isError ? (
          <PanelState
            compact
            kind="error"
            title="Contractor access is unavailable"
            description={parseApiError(contractors.error).message}
            onRetry={() => void contractors.refetch()}
          />
        ) : contractorRows.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Active registrations"
              value={
                contractorsComplete
                  ? activeContractors.length
                  : `≥${activeContractors.length}`
              }
            />
            <Stat
              label="Access or permit attention"
              value={
                contractorsComplete
                  ? contractorWatch.length
                  : `≥${contractorWatch.length}`
              }
              attention={contractorWatch.length > 0}
            />
            <Stat
              label="Under permit"
              value={`${contractorsComplete ? "" : "≥"}${contractorRows.filter((item) => item.requires_permit).length}`}
            />
          </div>
        ) : (
          <EmptyRow
            message={
              contractorsComplete
                ? "No contractors registered for this Site."
                : "No contractors for this Site in the loaded results."
            }
            href="/admin/contractors"
            label="Register one"
          />
        )}
      </ReportPanel>

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <div className="mb-3 border-b border-[var(--vms-line)] pb-4">
          <h2 className="text-base font-semibold">Lease attention</h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Expiry is derived from the tenant relationship’s effective end date.
          </p>
          {!relationshipsComplete &&
          !relationships.isPending &&
          !relationships.isError ? (
            <p
              role="status"
              className="mt-2 text-xs text-[var(--vms-ink-muted)]"
            >
              This list includes loaded relationships only.
            </p>
          ) : null}
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
          emptyMessage={
            relationshipsComplete
              ? "No leases expire in the next 60 days."
              : "No expiring leases in the loaded relationships."
          }
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
    </CommercialShell>
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
  value: number | string;
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
