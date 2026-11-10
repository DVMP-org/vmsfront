"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CircleDollarSign,
  Copy,
  FilePlus2,
  Landmark,
  ReceiptText,
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
import { CommercialShell, useCommercialAccess } from "./CommercialShell";
import {
  commercialApi,
  descendantIds,
  flattenPlaces,
  isCommercialInventory,
} from "./api";
import { titleCase } from "./contracts";

type FinanceRow = {
  id: string;
  assignment: Assignment;
  target_id: string;
  target: string;
  charge: string;
  payer: string;
  outstanding: number;
  currency: string;
  state: "outstanding" | "clear";
  status: string;
};

export default function CommercialFinance() {
  const { selectedProperty, contextKey, canManageFinance } =
    useCommercialAccess();
  const placeId = selectedProperty?.id || "";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const tree = useQuery({
    queryKey: ["commercial", contextKey, "tree"],
    queryFn: commercialApi.tree,
    enabled: !!placeId,
  });
  const assignments = useQuery({
    queryKey: ["commercial", contextKey, "charge-assignments", placeId],
    queryFn: commercialApi.chargeAssignments,
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
            target_id: assignment.target_place.id,
            target: assignment.target_place.name,
            charge: assignment.charge_definition.name,
            payer:
              assignment.current_responsibility?.responsible_party
                .display_name || "Unassigned",
            outstanding,
            currency: assignment.charge_definition.currency,
            state: outstanding > 0 ? "outstanding" : "clear",
            status: assignment.status || "active",
          };
        }),
    [assignments.data, scopeIds],
  );
  const currency = rows[0]?.currency || "USD";
  const openBalance = rows.reduce((sum, row) => sum + row.outstanding, 0);
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
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {titleCase(row.assignment.charge_definition.recurrence)}
          </span>
        </span>
      ),
    },
    {
      key: "target",
      header: "Commercial space",
      sortable: true,
      accessor: (row) => (
        <Link
          href={`/admin/places/${row.target_id}`}
          className="underline-offset-4 hover:underline"
        >
          {row.target}
        </Link>
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
      key: "state",
      header: "Collection",
      sortable: true,
      accessor: (row) => (
        <StatusBadge tone={row.state === "outstanding" ? "warning" : "success"}>
          {titleCase(row.state)}
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
      field: "target_id",
      label: "Commercial space",
      type: "select",
      isSearchable: true,
      options: places
        .filter(
          (place) => scopeIds.has(place.id) && isCommercialInventory(place),
        )
        .map((place) => ({ value: place.id, label: place.name })),
    },
    {
      field: "state",
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
    <CommercialShell
      title="Rent & service charges"
      description="Commercial charge assignments, responsible business Parties, balances and payment records."
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
      <SummaryStrip
        items={[
          {
            icon: ReceiptText,
            label: "Assignments",
            value: String(rows.length),
            detail: "For the selected property hierarchy",
          },
          {
            icon: WalletCards,
            label: "Outstanding",
            value: String(
              rows.filter((row) => row.state === "outstanding").length,
            ),
            detail: "Assignments with a positive balance",
          },
          {
            icon: CircleDollarSign,
            label: "Open balance",
            value: rows.length ? formatMoney(openBalance, currency) : "—",
            detail: "Uses each charge’s published currency",
          },
        ]}
      />
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 border-b border-[var(--vms-line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Commercial charge register
            </h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              Rent and service charges remain shared canonical finance records,
              filtered to this commercial property.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/charges">
                <Landmark className="h-4 w-4" aria-hidden="true" />
                Definitions
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
          searchPlaceholder="Search charges, spaces or responsible parties"
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
          emptyMessage="No commercial charge assignments match this property."
          tableLabel="Commercial charge assignments"
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
                  tone={row.state === "outstanding" ? "warning" : "success"}
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
    </CommercialShell>
  );
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function SummaryStrip({
  items,
}: {
  items: Array<{
    icon: LucideIcon;
    label: string;
    value: string;
    detail: string;
  }>;
}) {
  return (
    <section className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3">
      {items.map(({ icon: Icon, label, value, detail }) => (
        <div
          key={label}
          className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
            <Icon className="h-4 w-4 text-[var(--vms-coral)]" aria-hidden />
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">{detail}</p>
        </div>
      ))}
    </section>
  );
}
