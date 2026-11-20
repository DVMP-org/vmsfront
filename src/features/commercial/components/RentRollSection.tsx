"use client";

import Link from "next/link";
import type { Column } from "@/components/ui/DataTable";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { formatMoneyWithCode } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";
import {
  ageingBuckets,
  ageingTotals,
  type AgeingBucket,
  type RentRollRow,
} from "../lib";

const bucketTones: Record<AgeingBucket, StatusTone> = {
  current: "success",
  "1_30": "warning",
  "31_60": "warning",
  "61_90": "danger",
  "90_plus": "danger",
};

function bucketLabel(bucket: AgeingBucket) {
  return ageingBuckets.find((entry) => entry.key === bucket)?.label ?? bucket;
}

/**
 * Rent roll: one row per lettable space with a live tenant or an outstanding
 * balance, aged against the next unpaid due date. Arrears survive the tenancy,
 * so a vacant space with money owed stays on the roll.
 */
export function RentRollSection({
  rows,
  isLoading,
  errorMessage,
  onRetry,
}: {
  rows: RentRollRow[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  const totals = ageingTotals(rows);
  const columns: Column<RentRollRow>[] = [
    {
      key: "space",
      header: "Space",
      sortable: true,
      minWidth: 175,
      accessor: (row) => (
        <Link
          href={`/admin/places/${row.place_id}`}
          className="font-semibold underline-offset-4 hover:underline"
        >
          {row.space}
        </Link>
      ),
    },
    {
      key: "tenant",
      header: "Tenant",
      sortable: true,
      minWidth: 190,
      accessor: (row) =>
        row.tenant ?? (
          <span className="text-[var(--vms-ink-muted)]">
            Vacant — arrears only
          </span>
        ),
    },
    {
      key: "lease_ends_at",
      header: "Lease end",
      sortable: true,
      minWidth: 140,
      accessor: (row) =>
        row.lease_ends_at ? formatDate(row.lease_ends_at) : "No lease term",
    },
    {
      key: "balance",
      header: "Balance",
      sortable: false,
      minWidth: 145,
      accessor: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {row.currency
            ? formatMoneyWithCode(row.balance, row.currency)
            : "—"}
        </span>
      ),
    },
    {
      key: "bucket",
      header: "Arrears age",
      sortable: true,
      minWidth: 135,
      accessor: (row) => (
        <StatusBadge tone={bucketTones[row.bucket]}>
          {bucketLabel(row.bucket)}
        </StatusBadge>
      ),
    },
  ];

  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
      <div className="mb-3 border-b border-[var(--vms-line)] pb-4">
        <h2 className="text-base font-semibold">Balance by arrears age</h2>
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
          Compare occupied spaces and vacant spaces with a remaining balance.
        </p>
      </div>
      <ul
        aria-label="Outstanding money by arrears age"
        className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5"
      >
        {totals.map((bucket) => (
          <li
            key={bucket.key}
            className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
              {bucket.label}
            </p>
            <div className="mt-1 space-y-1">
              {bucket.amounts.length ? (
                bucket.amounts.map(({ currency, amount }) => (
                  <p
                    key={currency}
                    className={
                      (bucket.key === "61_90" || bucket.key === "90_plus") &&
                      amount > 0
                        ? "text-sm font-semibold tabular-nums text-[var(--vms-danger)]"
                        : "text-sm font-semibold tabular-nums"
                    }
                  >
                    {formatMoneyWithCode(amount, currency)}
                  </p>
                ))
              ) : (
                <p className="text-sm font-medium text-[var(--vms-ink-muted)]">
                  —
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search spaces or tenants"
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={onRetry}
        emptyMessage="No tenant or balance is attached to this property yet."
        tableLabel="Commercial rent roll"
        mobileSummary={(row) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/admin/places/${row.place_id}`}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  {row.space}
                </Link>
                <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                  {row.tenant ?? "Vacant — arrears only"}
                </p>
              </div>
              <StatusBadge tone={bucketTones[row.bucket]}>
                {bucketLabel(row.bucket)}
              </StatusBadge>
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {row.currency
                ? formatMoneyWithCode(row.balance, row.currency)
                : "—"}
              <span className="ml-2 text-xs font-normal text-[var(--vms-ink-muted)]">
                {row.lease_ends_at
                  ? `lease ends ${formatDate(row.lease_ends_at)}`
                  : "no lease term"}
              </span>
            </p>
          </div>
        )}
      />
    </section>
  );
}
