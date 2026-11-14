"use client";

import { CreditCard, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { formatMoney } from "@/lib/currency";
import { parseApiError } from "@/lib/error-utils";
import { usePayPublicBooking } from "../public-queries";
import type { PublicBookingCreated } from "../public-api-types";

/**
 * Paying for a stay the visitor has just requested.
 *
 * Two things this deliberately does not do.
 *
 * It does not show a price it computed itself. `amount_due`, `nights` and the
 * nightly rate all come back on the created booking, priced by the server from
 * the room's own rate — so the figure on this button is the figure the gateway
 * will charge, and a change to how a stay is priced never needs a change here.
 *
 * It does not take an amount from the visitor. The request carries only the
 * booking's id; the server prices what it already holds.
 *
 * The hand-off is a redirect to the provider's own hosted page, because a card
 * form on this page would put the Site inside the card-data path for no reason.
 */
export function PublicBookingPayment({
  siteSlug,
  booking,
}: {
  siteSlug: string;
  booking: PublicBookingCreated;
}) {
  const pay = usePayPublicBooking(siteSlug);

  // Nothing to charge: a reservation holding no room has no rate yet, and a room
  // priced at zero is a configuration the Site owner has not finished.
  if (!booking.payable || !booking.amount_due) {
    return null;
  }

  const amount = formatMoney(
    booking.amount_due,
    booking.currency ?? undefined,
  );
  const nights = booking.nights ?? 1;

  const start = () => {
    pay.mutate(booking.id, {
      onSuccess: (initialized) => {
        // The provider supplies the hosted page; we only route to it.
        window.location.assign(initialized.authorization_url);
      },
    });
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-[var(--vms-border)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--vms-ink)]">
            Pay {amount} now
          </p>
          <p className="text-xs text-[var(--vms-ink-muted)]">
            {nights} {nights === 1 ? "night" : "nights"}
            {booking.nightly_rate
              ? ` at ${formatMoney(booking.nightly_rate, booking.currency ?? undefined)} a night`
              : ""}
          </p>
        </div>
      </div>

      <Button
        type="button"
        onClick={start}
        disabled={pay.isPending}
        aria-busy={pay.isPending}
      >
        {pay.isPending ? (
          <Loader2 aria-hidden className="mr-2 size-4 animate-spin" />
        ) : (
          <CreditCard aria-hidden className="mr-2 size-4" />
        )}
        {pay.isPending ? "Opening secure payment" : `Pay ${amount}`}
      </Button>

      {pay.isError ? (
        <InlineAlert tone="danger">
          {parseApiError(pay.error).message}
        </InlineAlert>
      ) : null}

      <p className="text-xs text-[var(--vms-ink-muted)]">
        Paying does not confirm the stay — your request still has to be reviewed.
        If it is declined, contact the Site about a refund.
      </p>
    </div>
  );
}
