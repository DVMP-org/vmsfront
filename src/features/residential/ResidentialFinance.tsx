"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CircleDollarSign,
  Copy,
  FilePlus2,
  Landmark,
  ReceiptText,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import type { Assignment } from "@/features/charges/api";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";
import { titleCase } from "./contracts";

type FinanceRow = {
  id: string;
  assignment: Assignment;
  target_place_id: string;
  target: string;
  charge: string;
  payer: string;
  outstanding: number;
  balance_state: string;
  status: string;
  currency: string;
  group: string | null;
  schedule_count: number;
  open_schedule_count: number;
  next_due_date: string | null;
};

export default function ResidentialFinance() {
  const { contextKey, selectedSite, canManageFinance } =
    useResidentialAccess();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const placeId = selectedSite?.id || "";
  const tree = useQuery({
    queryKey: ["residential", contextKey, "tree"],
    queryFn: residentialApi.tree,
    enabled: !!placeId,
  });
  const assignments = useQuery({
    queryKey: ["residential", contextKey, "charge-assignments", placeId],
    queryFn: residentialApi.chargeAssignments,
    enabled: !!placeId,
  });
  const scopeIds = useMemo(
    () => (tree.data ? descendantIds(tree.data, placeId) : new Set<string>()),
    [placeId, tree.data],
  );
  const places = useMemo(
    () => (tree.data ? flattenPlaces(tree.data) : []),
    [tree.data],
  );
  const rows = useMemo<FinanceRow[]>(
    () =>
      (assignments.data || [])
        .filter((assignment) => scopeIds.has(assignment.target_place.id))
        .map((assignment) => {
          const outstanding = Number(assignment.outstanding_amount || 0);
          return {
            id: assignment.id,
            assignment,
            target_place_id: assignment.target_place.id,
            target: assignment.target_place.name,
            charge: assignment.charge_definition.name,
            payer:
              assignment.current_responsibility?.responsible_party
                .display_name || "Unassigned",
            outstanding,
            balance_state: outstanding > 0 ? "outstanding" : "clear",
            status: assignment.status || "active",
            currency: assignment.charge_definition.currency,
            group: assignment.target_place_group_name || null,
            schedule_count: assignment.schedule_count || 0,
            open_schedule_count: assignment.open_schedule_count || 0,
            next_due_date: assignment.next_due_date || null,
          };
        }),
    [assignments.data, scopeIds],
  );
  const outstanding = rows.reduce((sum, row) => sum + row.outstanding, 0);
  const overdue = rows.filter(
    (row) => row.balance_state === "outstanding",
  ).length;
  const columns: Column<FinanceRow>[] = [
    {
      key: "charge",
      header: "Charge",
      sortable: true,
      accessor: (row) => (
        <span>
          <Link
            href={`/admin/charges/assignments/${row.id}`}
            className="block font-semibold underline-offset-4 hover:underline"
          >
            {row.charge}
          </Link>
          <span className="mt-0.5 block text-xs text-[var(--vms-ink-muted)]">
            {titleCase(row.assignment.charge_definition.recurrence)}
          </span>
        </span>
      ),
    },
    {
      key: "target",
      header: "Property / unit",
      sortable: true,
      accessor: (row) => (
        <Link
          href={`/admin/charges/assignments/${row.id}`}
          className="underline-offset-4 hover:underline"
        >
          {row.target}
          {row.group ? (
            <span className="mt-0.5 block text-xs text-[var(--vms-ink-muted)]">
              Group · {row.group}
            </span>
          ) : null}
        </Link>
      ),
    },
    {
      key: "schedules",
      header: "Schedules",
      sortable: true,
      accessor: (row) => (
        <span className="text-sm">
          <strong className="block tabular-nums">
            {row.open_schedule_count} open
          </strong>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {row.next_due_date
              ? `Next ${new Date(row.next_due_date).toLocaleDateString()}`
              : `${row.schedule_count} total`}
          </span>
        </span>
      ),
    },
    {
      key: "payer",
      header: "Responsible Party",
      sortable: true,
      accessor: (row) => row.payer,
    },
    {
      key: "outstanding",
      header: "Balance",
      sortable: true,
      accessor: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(row.outstanding, row.currency)}
        </span>
      ),
    },
    {
      key: "balance_state",
      header: "Collection",
      sortable: true,
      accessor: (row) => (
        <StatusBadge
          tone={row.balance_state === "outstanding" ? "warning" : "success"}
        >
          {row.balance_state === "outstanding" ? "Outstanding" : "Clear"}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      header: "Assignment",
      sortable: true,
      accessor: (row) => titleCase(row.status),
    },
    {
      key: "open",
      header: "Actions",
      mobileHide: true,
      className: "text-right",
      accessor: (row) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/charges/assignments/${row.id}`}>Open</Link>
        </Button>
      ),
    },
  ];
  const filters: FilterDefinition[] = [
    {
      field: "target_place_id",
      label: "Unit or property",
      type: "select",
      isSearchable: true,
      options: places
        .filter((place) => scopeIds.has(place.id))
        .map((place) => ({ value: place.id, label: place.name })),
    },
    {
      field: "balance_state",
      label: "Balance",
      type: "select",
      options: [
        { value: "outstanding", label: "Outstanding" },
        { value: "clear", label: "Clear" },
      ],
    },
    {
      field: "status",
      label: "Assignment status",
      type: "select",
      options: Array.from(new Set(rows.map((row) => row.status))).map(
        (status) => ({ value: status, label: titleCase(status) }),
      ),
    },
  ];
  const bulkActions: BulkAction[] = [
    {
      label: "Copy assignment IDs",
      icon: Copy,
      onClick: async (ids) => {
        try {
          await navigator.clipboard.writeText(ids.join("\n"));
          toast.success(`${ids.length} assignment IDs copied.`);
        } catch {
          toast.error("The browser could not copy the selected assignments.");
        }
      },
    },
  ];

  return (
    <ResidentialShell
      title="Rent & service charges"
      description="Residential charge responsibility and outstanding balances, with direct access to definitions, schedules and payment records."
      primaryAction={
        canManageFinance ? (
          <Button asChild>
            <Link href="/admin/charges/new">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Create charge
            </Link>
          </Button>
        ) : undefined
      }
    >
      <section className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3">
        <Summary
          icon={ReceiptText}
          label="Assignments"
          value={String(rows.length)}
          detail="For the selected property hierarchy"
        />
        <Summary
          icon={WalletCards}
          label="Outstanding"
          value={rows.length ? String(overdue) : "—"}
          detail="Assignments with a positive balance"
        />
        <Summary
          icon={CircleDollarSign}
          label="Open balance"
          value={
            rows.length && rows[0]?.currency
              ? formatMoney(outstanding, rows[0].currency)
              : "—"
          }
          detail="Uses the currency published by each charge"
        />
      </section>

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 border-b border-[var(--vms-line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Charge register</h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              Rent and service charges remain canonical shared finance records;
              this view filters them to the residential property scope.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/charges">
                <Landmark className="h-4 w-4" aria-hidden="true" />
                Manage definitions
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/transactions">
                <WalletCards className="h-4 w-4" aria-hidden="true" />
                Payments
              </Link>
            </Button>
          </div>
        </div>
        <DataTable
          data={rows}
          columns={columns}
          availableFilters={filters}
          searchPlaceholder="Search charges, units or responsible parties"
          selectable
          selectedRows={selected}
          onSelectionChange={setSelected}
          bulkActions={bulkActions}
          isLoading={tree.isPending || assignments.isPending}
          errorMessage={
            tree.isError || assignments.isError
              ? parseApiError(tree.error || assignments.error).message
              : null
          }
          isStale={(tree.isError || assignments.isError) && rows.length > 0}
          onRetry={() => {
            void tree.refetch();
            void assignments.refetch();
          }}
          emptyMessage="No rent or service-charge assignments match this property."
          tableLabel="Residential charge assignments"
          scrollHint="Scroll horizontally to compare payers, balances and collection status."
          mobileSummary={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong>{row.charge}</strong>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {row.target} · {row.payer}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    row.balance_state === "outstanding" ? "warning" : "success"
                  }
                >
                  {formatMoney(row.outstanding, row.currency)}
                </StatusBadge>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/charges/assignments/${row.id}`}>
                  Open assignment
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        />
      </section>
    </ResidentialShell>
  );
}

function Summary({
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
    <div className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
        <Icon className="h-4 w-4 text-[var(--vms-coral)]" aria-hidden />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">{detail}</p>
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "NGN"} ${amount.toFixed(2)}`;
  }
}
