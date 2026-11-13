"use client";

import Link from "next/link";
import type { Column } from "@/components/ui/DataTable";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { formatMoney } from "@/lib/currency";
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
  currency,
  isLoading,
  errorMessage,
  onRetry,
}: {
  rows: RentRollRow[];
  currency: string;
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
      accessor: (row) => (
        <Link
          href={`/admin/places/${row.id}`}
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
      accessor: (row) =>
        row.lease_ends_at ? formatDate(row.lease_ends_at) : "No lease term",
    },
    {
      key: "balance",
      header: "Balance",
      sortable: true,
      accessor: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(row.balance, currency)}
        </span>
      ),
    },
    {
      key: "bucket",
      header: "Arrears age",
      sortable: true,
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
        <h2 className="text-base font-semibold">Rent roll &amp; arrears ageing</h2>
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
          Who owes what, how long it has been owed, and when the tenancy that
          owes it ends.
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
            <p
              className={
                (bucket.key === "61_90" || bucket.key === "90_plus") &&
                bucket.amount > 0
                  ? "mt-1 text-lg font-semibold tabular-nums text-[var(--vms-danger)]"
                  : "mt-1 text-lg font-semibold tabular-nums"
              }
            >
              {formatMoney(bucket.amount, currency)}
            </p>
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
                  href={`/admin/places/${row.id}`}
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
              {formatMoney(row.balance, currency)}
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
