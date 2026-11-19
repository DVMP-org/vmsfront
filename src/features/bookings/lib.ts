/**
 * Pure helpers for booking status and window presentation.
 *
 * Kept free of React so they can be unit tested and reused by any bookings
 * surface (list, detail drawer, host approval).
 */

import type { StatusTone } from "@/components/ui/StatusBadge";
import { humanize } from "@/lib/strings";
import type { BookingDto, BookingFinancialsDto } from "./api-types";
import type { BookingStatus, BookingSummary } from "./types";

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

/**
 * Fold a server booking into the presentational summary the register renders.
 *
 * The server exposes ids, not names, for the place and the host. Until the
 * bookings API joins them, a booking with no place yet — a hospitality
 * reservation — says so rather than showing a blank cell that reads as missing
 * data.
 */
export function toBookingSummary(booking: BookingDto): BookingSummary {
  return {
    id: booking.id,
    kind: booking.kind,
    domain: booking.domain,
    status: booking.status,
    placeName: booking.place_id ? "Assigned place" : "No place yet",
    hostName: null,
    requester: {
      name: booking.requester_name,
      email: booking.requester_email,
      phone: booking.requester_phone,
    },
    checkInAt: booking.check_in_at,
    checkOutAt: booking.check_out_at,
    guestCount: booking.guest_count,
    purpose: booking.purpose,
  };
}

/** The filter fields the register table offers, in one place. */
export const BOOKING_FILTER_FIELDS = ["kind", "status", "source"] as const;

export type BookingFilterField = (typeof BOOKING_FILTER_FIELDS)[number];

/**
 * Read one filter's value out of the table's filter list.
 *
 * The table speaks a generic `{field, operator, value}` shape while every register
 * speaks the API's query parameters. Translating here, once, keeps the mapping out
 * of the components and makes it testable without rendering a table.
 *
 * The field is a plain string rather than the bookings register's own field list:
 * reservations filter on fields bookings do not have, and a second copy of this
 * helper in that feature would be the same logic drifting apart.
 */
export function filterValue(
  filters: ReadonlyArray<{ field: string; value: unknown }>,
  field: string,
): string | undefined {
  const match = filters.find((entry) => entry.field === field);
  if (!match) return undefined;
  const value = match.value;
  if (Array.isArray(value)) {
    return typeof value[0] === "string" && value[0].length > 0
      ? value[0]
      : undefined;
  }
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Whether the bill is settled, part paid, or untouched.
 *
 * Derived from the server's financial summary rather than from `payment_status`,
 * which is a column somebody has to remember to update. "No price recorded" is
 * its own answer: it is not the same as paid and not the same as unpaid.
 */
export function paymentStatusView(
  financials: BookingFinancialsDto | null | undefined,
): {
  label: string;
  tone: StatusTone;
} {
  if (!financials || !financials.priced) {
    return { label: "No price recorded", tone: "neutral" };
  }
  const balance = Number(financials.balance);
  const paid = Number(financials.paid);
  if (!Number.isFinite(balance) || !Number.isFinite(paid)) {
    return { label: "Unknown", tone: "neutral" };
  }
  if (balance <= 0) return { label: "Paid", tone: "success" };
  if (paid > 0) return { label: "Part paid", tone: "warning" };
  return { label: "Unpaid", tone: "danger" };
}

/** Whole nights between two timestamps, or `null` when the window is unusable. */
export function stayNights(checkIn: string, checkOut: string): number | null {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Number.isFinite(nights) ? Math.max(nights, 0) : null;
}

/**
 * Both ends of a `date-range` table filter.
 *
 * The table emits one entry per end (`gte` for the start, `lte` for the end) and
 * `filterValue` only ever returns the first, so reading a range needs its own
 * helper rather than silently dropping the second bound.
 */
export function filterRange(
  filters: ReadonlyArray<{ field: string; operator?: string; value: unknown }>,
  field: string,
): { from?: string; to?: string } {
  const result: { from?: string; to?: string } = {};
  for (const entry of filters) {
    if (entry.field !== field) continue;
    const value =
      typeof entry.value === "string" && entry.value.length > 0
        ? entry.value
        : undefined;
    if (!value) continue;
    if (entry.operator === "lte") result.to = value;
    else result.from = value;
  }
  return result;
}

/**
 * The public address of a Site's booking page.
 *
 * Built from the origin the administrator is already on, because the page is
 * served on the organization's own subdomain — a link containing a different
 * host would send the guest somewhere the Site does not exist.
 */
export function publicBookingUrl(
  siteSlug: string | null | undefined,
  origin: string,
): string | null {
  const slug = (siteSlug || "").trim();
  if (!slug) return null;
  return `${origin.replace(/\/+$/, "")}/book/${encodeURIComponent(slug)}`;
}

/**
 * What the guest still owes, or `null` when no total was ever agreed.
 *
 * `null` and zero are different answers: no recorded price means there is
 * nothing to owe (a complimentary stay, or a legacy booking), while zero means
 * the bill is settled. Returning 0 for both would tell a guest they are paid up
 * when nobody ever wrote down a price.
 *
 * Only `captured` payments count. A refunded or voided row is money that is no
 * longer with the Site, and subtracting it would report a balance the guest has
 * already met.
 */
export function outstandingBalance(
  total: string | null,
  payments: ReadonlyArray<{ amount: string; status: string }>,
): number | null {
  if (total === null) return null;
  const agreed = Number(total);
  if (!Number.isFinite(agreed)) return null;
  const paid = payments
    .filter((payment) => payment.status === "captured")
    .reduce((sum, payment) => {
      const value = Number(payment.amount);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  return agreed - paid;
}
