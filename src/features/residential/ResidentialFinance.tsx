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
import { formatMoneyWithCode } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";
import { titleCase } from "@/lib/strings";
import { parseApiError } from "@/lib/error-utils";
import type { Assignment } from "@/features/charges/api";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";

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
  return <ResidentialFinanceView view="register" />;
}

export function ResidentialArrears() {
  return <ResidentialFinanceView view="arrears" />;
}

function ResidentialFinanceView({ view }: { view: "register" | "arrears" }) {
  const { contextKey, selectedSite, canManageFinance } = useResidentialAccess();
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
  const outstandingAssignments = rows.filter(
    (row) => row.balance_state === "outstanding",
  ).length;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const arrearsRows = rows.filter(
    (row) =>
      row.outstanding > 0 &&
      !!row.next_due_date &&
      row.next_due_date.slice(0, 10) < today,
  );
  const displayRows = view === "arrears" ? arrearsRows : rows;
  const balancesByCurrency = new Map<string, number>();
  for (const row of displayRows) {
    balancesByCurrency.set(
      row.currency,
      (balancesByCurrency.get(row.currency) ?? 0) + row.outstanding,
    );
  }
  const openBalanceLabel =
    [...balancesByCurrency]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([code, amount]) => formatMoneyWithCode(amount, code))
      .join(" · ") || "—";
  const columns: Column<FinanceRow>[] = [
    {
      key: "charge",
      header: "Charge",
      sortable: true,
      minWidth: 180,
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
      minWidth: 175,
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
      minWidth: 150,
      accessor: (row) => (
        <span className="text-sm">
          <strong className="block tabular-nums">
            {row.open_schedule_count} open
          </strong>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {row.next_due_date
              ? `Next ${formatDate(row.next_due_date)}`
              : `${row.schedule_count} total`}
          </span>
        </span>
      ),
    },
    {
      key: "payer",
      header: "Responsible Party",
      sortable: true,
      minWidth: 165,
      accessor: (row) => row.payer,
    },
    {
      key: "outstanding",
      header: "Balance",
      sortable: true,
      minWidth: 155,
      className: "text-right",
      accessor: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoneyWithCode(row.outstanding, row.currency)}
        </span>
      ),
    },
    {
      key: "balance_state",
      header: "Collection",
      sortable: true,
      minWidth: 120,
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
      minWidth: 115,
      accessor: (row) => titleCase(row.status),
    },
    {
      key: "open",
      header: "Actions",
      mobileHide: true,
      className: "w-28 text-right",
      minWidth: 104,
      accessor: (row) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/charges/assignments/${row.id}`}>
            Open assignment
          </Link>
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
      title={view === "arrears" ? "Arrears" : "Assignments"}
      description={
        view === "arrears"
          ? "Follow up residential assignments whose earliest open schedule is past due. The balance shown includes all open schedules on each assignment."
          : "Review residential charge assignments, responsible Parties, schedules and balances in the selected Site."
      }
      primaryAction={
        view === "register" && canManageFinance ? (
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
          label={view === "arrears" ? "Past-due assignments" : "Assignments"}
          value={String(displayRows.length)}
          detail={
            view === "arrears"
              ? "Earliest open due date is before today"
              : "In the selected Site hierarchy"
          }
        />
        <Summary
          icon={WalletCards}
          label={view === "arrears" ? "Places with arrears" : "Outstanding"}
          value={String(
            view === "arrears"
              ? new Set(arrearsRows.map((row) => row.target_place_id)).size
              : outstandingAssignments,
          )}
          detail={
            view === "arrears"
              ? "Distinct Places with a past-due assignment"
              : "Assignments with a positive balance"
          }
        />
        <Summary
          icon={CircleDollarSign}
          label="Open balance by currency"
          value={openBalanceLabel}
          detail={
            view === "arrears"
              ? "All open schedules on past-due assignments"
              : "Each charge currency is totaled separately"
          }
        />
      </section>

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 border-b border-[var(--vms-line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              {view === "arrears"
                ? "Past-due assignments"
                : "Charge assignments"}
            </h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              {view === "arrears"
                ? "These assignments have a past-due open schedule. Open the assignment to inspect individual schedules and exact overdue amounts."
                : "Review each assigned charge and its responsible Party in the selected Site."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={
                  view === "arrears"
                    ? "/admin/residential/finance"
                    : "/admin/charges"
                }
              >
                <Landmark className="h-4 w-4" aria-hidden="true" />
                {view === "arrears" ? "Charge register" : "Definitions"}
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
          data={displayRows}
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
          emptyMessage={
            view === "arrears"
              ? "No past-due residential charge assignments in this Site."
              : "No residential charge assignments match this Site."
          }
          tableLabel={
            view === "arrears"
              ? "Residential past-due charge assignments"
              : "Residential charge assignments"
          }
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
                  {formatMoneyWithCode(row.outstanding, row.currency)}
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
      <p className="mt-2 break-words text-2xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">{detail}</p>
    </div>
  );
}
