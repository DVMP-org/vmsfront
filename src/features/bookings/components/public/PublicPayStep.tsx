"use client";

import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";
import { PublicBookingPayment } from "../PublicBookingPayment";
import type { PublicBookingCreated } from "../../public-api-types";

/**
 * The last step of the flow: pay, or leave the room held.
 *
 * Which of those two it is was decided by the guest one screen earlier, not here.
 * A **booking** is paid for when it is made, so this screen has no way past it —
 * the room is only held while the payment is being completed. A **reservation**
 * is an option on a room: it sits until the Site's hold window runs out, and the
 * guest may pay now or not at all.
 *
 * The amount is the server's, from the booking it already holds. Nothing here
 * computes a price.
 */
export function PublicPayStep({
  siteSlug,
  created,
  onDone,
}: {
  siteSlug: string;
  created: PublicBookingCreated;
  onDone: () => void;
}) {
  const due =
    created.amount_due && created.currency
      ? formatMoney(created.amount_due, created.currency)
      : null;
  const heldUntil = created.hold_expires_at
    ? formatDateTime(created.hold_expires_at)
    : null;

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface)] p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-[var(--vms-ink)]">
          {created.payment_required && due
            ? `Pay ${due} to complete your booking`
            : "Your rooms are held"}
        </h1>
        <p className="text-sm text-[var(--vms-ink-muted)]">
          {created.payment_required
            ? "The rooms stay reserved for you while you pay."
            : "Nothing has been charged. You can pay now or when you arrive."}
        </p>
      </header>

      {heldUntil ? (
        <p
          role="note"
          className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-muted)] px-3 py-2 text-xs text-[var(--vms-ink)]"
        >
          {created.payment_required
            ? `If payment is not completed by ${heldUntil}, the rooms go back on sale.`
            : `Your rooms are held until ${heldUntil}. After that they go back on sale.`}
        </p>
      ) : null}

      <PublicBookingPayment siteSlug={siteSlug} booking={created} />

      {created.payment_required ? null : (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onDone}>
            Done — I'll pay later
          </Button>
        </div>
      )}
    </section>
  );
}
