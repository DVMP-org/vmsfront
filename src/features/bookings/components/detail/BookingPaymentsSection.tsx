"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import { outstandingBalance } from "../../lib";
import type { BookingDetailDto, RecordBookingPaymentInput } from "../../api-types";
import { useBookingPayments, useRecordBookingPayment } from "../../queries";

const METHODS: Array<NonNullable<RecordBookingPaymentInput["method"]>> = [
  "card",
  "transfer",
  "cash",
  "other",
];

/** A booking nobody has started collecting on is still open to a payment. */
const CLOSED_STATUSES = new Set(["declined", "cancelled", "expired"]);

/**
 * What the arrangement is worth, what has been taken, and what is left.
 *
 * The balance is derived from the payments rather than read from the booking,
 * because `payment_status` is a column somebody has to remember to update and a
 * sum of captured rows is a fact. When no total was ever recorded the balance is
 * withheld entirely instead of shown as zero — "unpriced" is not "settled".
 */
export function BookingPaymentsSection({
  booking,
}: {
  booking: BookingDetailDto;
}) {
  const payments = useBookingPayments(booking.id);
  const record = useRecordBookingPayment(booking.id);

  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState<NonNullable<RecordBookingPaymentInput["method"]>>("card");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rows = payments.data ?? [];
  const balance = outstandingBalance(booking.total, rows);
  const canTake = !CLOSED_STATUSES.has(booking.status);

  async function submit() {
    setError(null);
    try {
      await record.mutateAsync({
        amount: amount.trim(),
        method,
        reference: reference.trim() || null,
      });
      setAmount("");
      setReference("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "That payment could not be recorded.",
      );
    }
  }

  return (
    <section aria-label="Payments" className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
            Agreed
          </dt>
          <dd className="text-sm font-medium text-[var(--vms-ink)]">
            {booking.total === null ? (
              <span className="font-normal text-[var(--vms-ink-muted)]">
                No price recorded
              </span>
            ) : (
              formatMoney(booking.total, booking.currency)
            )}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
            Taken
          </dt>
          <dd className="text-sm font-medium text-[var(--vms-ink)]">
            {formatMoney(
              rows
                .filter((row) => row.status === "captured")
                .reduce((sum, row) => sum + Number(row.amount), 0),
              booking.currency,
            )}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
            Balance
          </dt>
          <dd className="text-sm font-medium text-[var(--vms-ink)]">
            {balance === null ? (
              <span className="font-normal text-[var(--vms-ink-muted)]">
                Unknown
              </span>
            ) : (
              formatMoney(balance, booking.currency)
            )}
          </dd>
        </div>
      </dl>

      {canTake ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
            Record a payment
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,8rem)_minmax(0,9rem)_minmax(0,1fr)_auto]">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="booking-payment-amount"
                className="text-[11px] font-medium text-[var(--vms-ink)]"
              >
                Amount
              </label>
              <Input
                id="booking-payment-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="150.00"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="booking-payment-method"
                className="text-[11px] font-medium text-[var(--vms-ink)]"
              >
                Method
              </label>
              <select
                id="booking-payment-method"
                value={method}
                onChange={(event) =>
                  setMethod(
                    event.target.value as NonNullable<
                      RecordBookingPaymentInput["method"]
                    >,
                  )
                }
                className="min-h-11 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
              >
                {METHODS.map((choice) => (
                  <option key={choice} value={choice}>
                    {humanize(choice)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="booking-payment-reference"
                className="text-[11px] font-medium text-[var(--vms-ink)]"
              >
                Reference <span className="font-normal">(optional)</span>
              </label>
              <Input
                id="booking-payment-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Receipt or transfer ref"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                size="sm"
                disabled={!amount.trim() || record.isPending}
                isLoading={record.isPending}
                onClick={() => void submit()}
              >
                Record
              </Button>
            </div>
          </div>
          {error ? (
            <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-[var(--vms-ink-muted)]">
          This booking is {humanize(booking.status)}, so no further payment can be
          recorded against it.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
          Payments
        </h3>
        {payments.isPending ? (
          <PanelState
            kind="loading"
            compact
            title="Loading payments"
            description="Fetching what has been taken against this booking."
          />
        ) : payments.isError ? (
          <PanelState
            kind="error"
            compact
            title="Payments could not be loaded"
            description="Try again."
            onRetry={() => void payments.refetch()}
            isRetrying={payments.isFetching}
            retryLabel="Retry payments"
          />
        ) : rows.length === 0 ? (
          <PanelState
            kind="empty"
            compact
            title="Nothing taken yet"
            description="Payments recorded at the desk or settled online appear here."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--vms-line)]">
            {rows.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
              >
                <span className="font-medium text-[var(--vms-ink)]">
                  {formatMoney(payment.amount, payment.currency)}
                  <span className="ml-2 text-xs font-normal text-[var(--vms-ink-muted)]">
                    {humanize(payment.method ?? "unspecified")} · {payment.status}
                  </span>
                </span>
                <span className="text-xs text-[var(--vms-ink-muted)]">
                  {payment.folio_line_id ? "On the folio · " : "Not posted · "}
                  {formatDateTime(payment.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
