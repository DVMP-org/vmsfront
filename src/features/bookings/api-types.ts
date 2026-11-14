/**
 * The live bookings API, as the server actually answers it.
 *
 * These are transport shapes, deliberately separate from the presentational
 * contract in `types.ts`: the register renders `BookingSummary`, while these
 * mirror `/admin/bookings` field for field. Keeping them apart is what lets the
 * UI stop caring when the server adds a column.
 */

import type { BookingDomain, BookingKind, BookingStatus } from "./types";

export interface BookingActivityDto {
  id: string;
  event_type: string;
  message: string | null;
  data: Record<string, unknown> | null;
  occurred_at: string;
}

export interface BookingDto {
  id: string;
  site_id: string;
  place_id: string | null;
  kind: BookingKind;
  domain: BookingDomain;
  host_party_id: string | null;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  status: BookingStatus;
  check_in_at: string;
  check_out_at: string;
  guest_count: number;
  purpose: string | null;
  decline_reason: string | null;
  approved_at: string | null;
  approved_by: "host" | "site_admin" | null;
  /** What approval produced: invitation, stay, badge, guest party. */
  outcome: Record<string, unknown> | null;
  created_at: string;
}

export interface BookingDetailDto extends BookingDto {
  activities: BookingActivityDto[];
}

export type BookingPaymentStatus = "captured" | "refunded" | "void";

export interface BookingPaymentDto {
  id: string;
  booking_id: string;
  amount: string;
  currency: string;
  status: BookingPaymentStatus;
  method: string | null;
  reference: string | null;
  /** Set once the money has been posted into the stay's folio. */
  folio_line_id: string | null;
  created_at: string;
}

export interface BookingListParams {
  page?: number;
  page_size?: number;
  status?: BookingStatus;
  place_id?: string;
}

export interface RecordBookingPaymentInput {
  amount: string;
  currency?: string;
  method?: "card" | "transfer" | "cash" | "other";
  reference?: string | null;
}

/**
 * A booking taken by staff.
 *
 * The domain is absent on purpose: it is the Site's, and the server refuses a
 * payload that tries to assert one.
 */
export interface AdminBookingCreateInput {
  kind: "booking" | "reservation";
  source: "phone" | "walk_in" | "staff";
  place_id?: string | null;
  host_party_id?: string | null;
  check_in_at: string;
  check_out_at: string;
  guest_count: number;
  requester_name: string;
  requester_email?: string | null;
  requester_phone?: string | null;
  purpose?: string | null;
  notes?: string | null;
}

export const BOOKING_DOMAIN_LABEL: Record<BookingDomain, string> = {
  residential: "Residential",
  commercial: "Commercial",
  mixed_use: "Mixed use",
  hospitality: "Hospitality",
};

/** A booking awaiting money is not yet decidable, so it cannot be approved. */
export function canDecide(booking: Pick<BookingDto, "status" | "domain">): boolean {
  if (booking.domain !== "residential" && booking.domain !== "hospitality") {
    return false;
  }
  return booking.status === "requested";
}
