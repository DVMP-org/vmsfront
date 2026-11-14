"use client";

import { BookingDateRange } from "./BookingDateRange";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { RequesterCell } from "./RequesterCell";
import { BOOKING_DOMAIN_LABEL } from "../api-types";
import type { BookingDto } from "../api-types";
import { cn } from "@/lib/utils";

/**
 * One booking in the Site register.
 *
 * A row is a button, not a div: selecting a booking is the only thing a row
 * does, so it has to be reachable and activatable from the keyboard and it has
 * to say which booking it opens.
 */
export function BookingRegisterRow({
  booking,
  selected,
  onSelect,
}: {
  booking: BookingDto;
  selected: boolean;
  onSelect: (bookingId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(booking.id)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex min-h-11 w-full flex-col gap-2 rounded-lg border px-4 py-3 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]",
        selected
          ? "border-[var(--vms-accent)] bg-[var(--vms-surface-muted)]"
          : "border-[var(--vms-border)] hover:bg-[var(--vms-surface-muted)]",
      )}
    >
      <span className="flex flex-wrap items-center gap-2">
        <RequesterCell
          requester={{
            name: booking.requester_name,
            email: booking.requester_email,
            phone: booking.requester_phone,
          }}
        />
        <BookingStatusBadge status={booking.status} />
      </span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--vms-ink-muted)]">
        <span>{BOOKING_DOMAIN_LABEL[booking.domain]}</span>
        <BookingDateRange from={booking.check_in_at} to={booking.check_out_at} />
        <span>
          {booking.guest_count} {booking.guest_count === 1 ? "guest" : "guests"}
        </span>
        {booking.kind === "reservation" ? <span>No room yet</span> : null}
      </span>
    </button>
  );
}
