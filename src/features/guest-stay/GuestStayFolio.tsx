"use client";

import { ReceiptText } from "lucide-react";

import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import type { GuestFolio } from "@/features/hospitality/contracts";
import { useGuestStayFolio } from "./queries";

const CATEGORY_LABEL: Record<GuestFolio["lines"][number]["category"], string> = {
  room: "Room",
  service: "Service",
  charge: "Charge",
  payment: "Payment",
};

/**
 * What this stay costs and what has been paid.
 *
 * Payments are rows like any other posting, so they are shown in place rather
 * than being subtracted silently: a guest who paid at booking can see the money
 * arrive, and one who has not can see what is still owed.
 */
export function GuestStayFolio({ stayId }: { stayId: string }) {
  const folio = useGuestStayFolio(stayId);

  if (folio.isPending) {
    return (
      <div
        aria-hidden="true"
        className="h-24 animate-pulse rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
      />
    );
  }

  if (folio.isError || !folio.data) {
    return (
      <div
        role="alert"
        className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-3 text-xs text-[var(--vms-danger)]"
      >
        <p className="font-semibold">Your bill could not be loaded</p>
        <p className="mt-1">{parseApiError(folio.error).message}</p>
        <button
          type="button"
          onClick={() => folio.refetch()}
          className="mt-2 min-h-11 font-semibold underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const data = folio.data;
  const settled = data.status === "settled";

  return (
    <section
      aria-labelledby={`folio-${data.id}`}
      className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          id={`folio-${data.id}`}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]"
        >
          <ReceiptText className="h-4 w-4" aria-hidden="true" />
          Your bill
        </h3>
        <span
          className={
            settled
              ? "rounded-full border border-[color-mix(in_srgb,var(--vms-success)_35%,white)] bg-[var(--vms-success-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vms-success)]"
              : "rounded-full border border-[var(--vms-line-strong)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vms-ink-muted)]"
          }
        >
          {settled ? "Settled" : "Open"}
        </span>
      </div>

      {data.lines.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--vms-ink-muted)]">
          Nothing has been charged to this stay yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-[var(--vms-line)]">
          {data.lines.map((line) => (
            <li
              key={line.id}
              className="flex items-baseline justify-between gap-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{line.description}</span>
                <span className="ml-2 text-[11px] uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                  {CATEGORY_LABEL[line.category]}
                </span>
                <span className="block text-[11px] text-[var(--vms-ink-muted)]">
                  {formatDateTime(line.created_at)}
                </span>
              </span>
              <span
                className={
                  line.category === "payment"
                    ? "shrink-0 font-semibold text-[var(--vms-success)]"
                    : "shrink-0 font-semibold"
                }
              >
                {line.category === "payment" ? "−" : ""}
                {formatMoney(line.amount, line.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-3 grid gap-1 border-t border-[var(--vms-line)] pt-3 text-sm">
        <div className="flex items-baseline justify-between">
          <dt className="text-[var(--vms-ink-muted)]">Charges</dt>
          <dd>{formatMoney(data.total, data.currency)}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-[var(--vms-ink-muted)]">Paid</dt>
          <dd>{formatMoney(data.paid, data.currency)}</dd>
        </div>
        <div className="flex items-baseline justify-between font-semibold">
          <dt>Balance</dt>
          <dd>{formatMoney(data.balance, data.currency)}</dd>
        </div>
      </dl>
    </section>
  );
}
