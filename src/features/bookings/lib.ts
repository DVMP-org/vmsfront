/**
 * Pure helpers for booking status and window presentation.
 *
 * Kept free of React so they can be unit tested and reused by any bookings
 * surface (list, detail drawer, host approval).
 */

import type { StatusTone } from "@/components/ui/StatusBadge";
import { humanize } from "@/lib/strings";
import type { BookingDto } from "./api-types";
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
 * The table speaks a generic `{field, operator, value}` shape while the register
 * speaks the API's query parameters. Translating here, once, keeps the mapping
 * out of the component and makes it testable without rendering a table.
 */
export function filterValue(
  filters: ReadonlyArray<{ field: string; value: unknown }>,
  field: BookingFilterField,
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
