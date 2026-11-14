/**
 * Pure helpers for booking status and window presentation.
 *
 * Kept free of React so they can be unit tested and reused by any bookings
 * surface (list, detail drawer, host approval).
 */

import type { StatusTone } from "@/components/ui/StatusBadge";
import { humanize } from "@/lib/strings";
import type { BookingStatus } from "./types";

const toneByStatus: Record<BookingStatus, StatusTone> = {
  pending_payment: "warning",
  requested: "warning",
  confirmed: "info",
  declined: "danger",
  cancelled: "neutral",
  checked_in: "success",
  checked_out: "neutral",
  no_show: "danger",
  expired: "neutral",
};

/** Semantic tone for a booking status, used to colour the status atom. */
export function bookingStatusTone(status: BookingStatus): StatusTone {
  return toneByStatus[status] ?? "neutral";
}

/** Human label for a booking status, e.g. "checked_in" -> "Checked in". */
export function bookingStatusLabel(status: BookingStatus): string {
  return humanize(status);
}

const windowFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** "Mar 4, 2:00 PM – Mar 5, 10:00 AM", or an em dash for unusable input. */
export function formatBookingWindow(from: string, to: string): string {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "—";
  }
  return `${windowFormatter.format(start)} – ${windowFormatter.format(end)}`;
}
