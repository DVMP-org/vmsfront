"use client";

import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";

import type { LeaseChargeLine } from "../api";
import {
  cadenceLabel,
  groupPlanByCadence,
  monthlyEquivalent,
  oneOffTotal,
} from "../lib";

/**
 * The charge plan of a lease, grouped by cadence.
 *
 * This is the "what will this lease bill" view. It reads the plan lines, not the
 * charge tables, so a draft shows exactly what confirmation would create.
 */
export function LeasePlanSummary({
  lines,
  currency,
  emptyCopy = "No charges have been planned for this lease yet.",
}: {
  lines: LeaseChargeLine[];
  currency: string;
  emptyCopy?: string;
}) {
  const groups = groupPlanByCadence(lines);

  if (groups.length === 0) {
    return (
      <p className="rounded-[var(--vms-radius-surface)] border border-dashed border-[var(--vms-border)] p-4 text-sm text-[var(--vms-ink-muted)]">
        {emptyCopy}
      </p>
    );
  }

  const monthly = monthlyEquivalent(lines);
  const oneOff = oneOffTotal(lines);

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-[var(--vms-border)] rounded-[var(--vms-radius-surface)] border border-[var(--vms-border)]">
        {groups.map((group) => (
          <li
            key={group.cadence}
            className="flex items-start justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--vms-ink)]">
                {cadenceLabel(group.cadence)}
              </p>
              <p className="truncate text-xs text-[var(--vms-ink-muted)]">
                {group.names.join(" · ")}
              </p>
            </div>
            <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-[var(--vms-ink)]">
              {formatMoney(group.total, currency)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--vms-ink-muted)]">
        <div className="flex items-center gap-1.5">
          <dt>Recurring</dt>
          <dd className="font-semibold tabular-nums text-[var(--vms-ink)]">
            ≈ {formatMoney(monthly, currency)}/month
          </dd>
        </div>
        {oneOff > 0 ? (
          <div className="flex items-center gap-1.5">
            <dt>One-off</dt>
            <dd className="font-semibold tabular-nums text-[var(--vms-ink)]">
              {formatMoney(oneOff, currency)}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

/** The exact dates the plan covers, shown beside the totals. */
export function LeasePlanWindow({
  firstDue,
  lastDue,
}: {
  firstDue: string;
  lastDue: string;
}) {
  return (
    <p className="text-xs text-[var(--vms-ink-muted)]">
      First installment {formatDate(firstDue)}, last {formatDate(lastDue)}
    </p>
  );
}
