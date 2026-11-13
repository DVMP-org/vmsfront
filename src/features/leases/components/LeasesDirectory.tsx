"use client";

import { useMemo, useState } from "react";
import { CalendarClock, FilePlus2, FileSignature, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSiteAccess } from "@/features/context/use-site-access";
import { placePartyKindFor } from "@/features/places/roles";
import { formatMoney } from "@/lib/currency";
import { useAppStore } from "@/store/app-store";

import type { Lease, LeaseStatus } from "../api";
import {
  leaseAttentionReasons,
  leaseExpiryCopy,
  leaseStatusLabel,
  leaseStatusTone,
  leaseTermLabel,
  monthlyEquivalent,
} from "../lib";
import {
  useLeasePartyOptions,
  useLeasePlaceOptions,
  useLeases,
} from "../queries";
import { LeaseDetailDrawer } from "./LeaseDetailDrawer";
import { LeaseFormDrawer } from "./LeaseFormDrawer";
import { TerminateLeaseDialog } from "./TerminateLeaseDialog";

const statusFilters: { value: "all" | LeaseStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring" },
  { value: "terminated", label: "Ended" },
];

/**
 * Site leases: every agreement, its term and the charges it bills.
 *
 * A lease is not a bill. This screen makes that separation visible: a draft
 * shows a plan, and confirming it is what creates the charge definitions,
 * assignments and schedules.
 */
export function LeasesDirectory() {
  const storedSite = useAppStore((state) => state.selectedSite);
  const access = useSiteAccess();
  const selectedSite =
    access.workspace.data?.management?.selected_site ?? storedSite;
  const siteId = selectedSite?.id;
  const useCase = access.workspace.data?.effective_use_case;
  const canManage =
    access.isAdministrator || access.allowed(["leases.create", "leases.update"]);

  const [statusFilter, setStatusFilter] = useState<"all" | LeaseStatus>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lease | null>(null);
  const [detail, setDetail] = useState<Lease | null>(null);
  const [terminating, setTerminating] = useState<Lease | null>(null);

  const query = useLeases(siteId);
  const placeOptions = useLeasePlaceOptions(siteId);
  const partyOptions = useLeasePartyOptions(siteId);

  const allRows = useMemo(() => query.data?.items ?? [], [query.data]);
  const rows =
    statusFilter === "all"
      ? allRows
      : allRows.filter((row) => row.status === statusFilter);

  const active = allRows.filter(
    (row) => row.status === "active" || row.status === "expiring",
  );
  const drafts = allRows.filter(
    (row) => row.status === "draft" || row.status === "pending_signature",
  ).length;
  const expiring = allRows.filter((row) => {
    if (row.status !== "active" && row.status !== "expiring") return false;
    return leaseExpiryCopy(row).tone === "warning";
  }).length;
  const monthly = active.reduce(
    (total, row) => total + monthlyEquivalent(row.charge_lines),
    0,
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(lease: Lease) {
    setEditing(lease);
    setDetail(null);
    setFormOpen(true);
  }

  const columns: Column<Lease>[] = [
    {
      key: "party",
      header: "Party",
      sortable: true,
      accessor: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--vms-ink)]">
            {row.party_name ?? "Unknown party"}
          </p>
          <p className="truncate text-xs text-[var(--vms-ink-muted)]">
            {row.place_name ?? "Unknown space"}
          </p>
        </div>
      ),
    },
    {
      key: "term",
      header: "Term",
      sortable: true,
      responsiveHide: "md",
      accessor: (row) => (
        <div className="text-sm text-[var(--vms-ink)]">
          <p>{leaseTermLabel(row)}</p>
          <p className="text-xs text-[var(--vms-ink-muted)]">
            {leaseExpiryCopy(row).label}
          </p>
        </div>
      ),
    },
    {
      key: "billing",
      header: "Bills",
      responsiveHide: "lg",
      accessor: (row) => {
        const value = monthlyEquivalent(row.charge_lines);
        if (value === 0) {
          return (
            <span className="text-xs text-[var(--vms-ink-muted)]">
              No charges planned
            </span>
          );
        }
        return (
          <div className="text-sm tabular-nums text-[var(--vms-ink)]">
            <p>≈ {formatMoney(value, row.currency)}/month</p>
            <p className="text-xs text-[var(--vms-ink-muted)]">
              {row.charge_lines.filter((line) => line.status !== "cancelled").length}{" "}
              charges
            </p>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (row) => {
        const attention = leaseAttentionReasons(row);
        return (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge tone={leaseStatusTone(row.status)}>
              {leaseStatusLabel(row.status)}
            </StatusBadge>
            {attention.length > 0 ? (
              <span className="text-xs text-[var(--vms-ink-muted)]">
                {attention[0].label}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDetail(row)}
        >
          Manage
        </Button>
      ),
    },
  ];

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow="Leases"
        title="Agreements and what they bill"
        description="A lease holds the term and a charge plan. Confirming it creates the charges that actually bill the party."
        primaryAction={
          canManage ? (
            <Button onClick={openCreate} disabled={!siteId}>
              <FilePlus2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Draft a lease
            </Button>
          ) : null
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Live leases", value: active.length, icon: FileSignature },
          { label: "Drafts to confirm", value: drafts, icon: ReceiptText },
          { label: "Expiring within 60 days", value: expiring, icon: CalendarClock },
          { label: "Contract value / month", value: formatMoney(monthly, active[0]?.currency ?? "NGN"), icon: ReceiptText },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-border)] bg-[var(--vms-surface)] p-4"
          >
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--vms-ink-muted)]">
              <stat.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--vms-ink)]">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
            aria-pressed={statusFilter === filter.value}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {!siteId ? (
        <EmptyState
          title="Select a property"
          description="Leases belong to a property. Choose one to see its agreements."
        />
      ) : query.isError ? (
        <EmptyState
          title="Leases could not be loaded"
          description="Try again, or check that the leases module is enabled for this property."
          action={{ label: "Retry", onClick: () => void query.refetch() }}
        />
      ) : !query.isLoading && allRows.length === 0 ? (
        <EmptyState
          title="No leases yet"
          description="Draft the first agreement for this property. Nothing is billed until you confirm it."
          action={canManage ? { label: "Draft a lease", onClick: openCreate } : undefined}
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          isLoading={query.isLoading}
          searchable={false}
          emptyMessage="No leases in this state."
          tableLabel="Site leases"
          getRowId={(row) => row.id}
        />
      )}

      <LeaseFormDrawer
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        siteId={siteId}
        lease={editing}
        places={placeOptions.data ?? []}
        parties={partyOptions.data ?? []}
        defaultPartyKind={
          placePartyKindFor(useCase) === "person" ? "person" : "organization"
        }
      />

      <LeaseDetailDrawer
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        siteId={siteId}
        lease={detail}
        onEdit={openEdit}
        onTerminate={(lease) => {
          setDetail(null);
          setTerminating(lease);
        }}
      />

      <TerminateLeaseDialog
        isOpen={Boolean(terminating)}
        onClose={() => setTerminating(null)}
        siteId={siteId}
        lease={terminating}
      />
    </main>
  );
}
