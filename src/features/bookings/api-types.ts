/**
 * The live bookings API, as the server actually answers it.
 *
 * These are transport shapes, deliberately separate from the presentational
 * contract in `types.ts`: the register renders `BookingSummary`, while these
 * mirror `/admin/bookings` field for field. Keeping them apart is what lets the
 * UI stop caring when the server adds a column.
 */

import type {
  BookingDomain,
  BookingKind,
  BookingSource,
  BookingStatus,
} from "./types";
import type {
  BookingItemDto,
  ReservationDto,
} from "@/features/reservations/api-types";

export interface BookingActivityDto {
  id: string;
  event_type: string;
  message: string | null;
  data: Record<string, unknown> | null;
  occurred_at: string;
}

/**
 * The bill, as the server derived it from persisted lines.
 *
 * Decimal strings, not numbers: money is never rounded on the way to the screen.
 * `priced` separates "nothing owed" from "no price agreed"; `billed` says a stay
 * (and so a folio) exists and `additional` covers what was bought on top.
 */
export interface BookingFinancialsDto {
  currency: string;
  accommodation: string;
  additional: string;
  total: string;
  paid: string;
  balance: string;
  priced: boolean;
  billed: boolean;
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
  /** How the booking reached the Site: public page, phone, walk-in, staff. */
  source: BookingSource;
  check_in_at: string;
  check_out_at: string;
  guest_count: number;
  purpose: string | null;
  decline_reason: string | null;
  approved_at: string | null;
  approved_by: "host" | "site_admin" | null;
  /** What approval produced: invitation, stay, badge, guest party. */
  outcome: Record<string, unknown> | null;
  /** The reference the guest quotes on the phone, once one is assigned. */
  reference: string | null;
  currency: string;
  /**
   * What the booking was agreed at. `null` means no price was recorded, which is
   * neither zero nor "free" — the priced lines on `items` are the truth.
   */
  total: string | null;
  /** `null` while nobody has recorded a payment against this booking. */
  payment_status: string | null;
  created_at: string;
  /** Derived from the recorded lines by the server, never from a counter. */
  financials?: BookingFinancialsDto | null;
}

export interface BookingDetailDto extends BookingDto {
  activities: BookingActivityDto[];
  /** What was bought, priced when it was bought. */
  items: BookingItemDto[];
  /** Capacity held against it — one per room, not one per booking. */
  reservations: ReservationDto[];
  /** The stay approval opened: what check-in, check-out and the folio act on. */
  hospitality_stay_id?: string | null;
  hospitality_stay_status?: string | null;
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
  /** When it was taken; falls back to `created_at` on older rows. */
  paid_at?: string | null;
  note?: string | null;
  recorded_by_admin_id?: string | null;
  created_at: string;
}

export interface BookingListParams {
  page?: number;
  page_size?: number;
  status?: BookingStatus;
  /** A reservation is a booking whose room is not named yet, so the register
   *  shows both and this is what tells them apart. */
  kind?: BookingKind;
  source?: BookingSource;
  place_id?: string;
  /** Matches the guest's name, email, phone or stated purpose, server-side. */
  search?: string;
  /**
   * Overlap filter on the stay window, not on the creation date. Anything whose
   * period intersects the window is returned — half-open, so a check-out morning
   * does not collide with the same day's check-in.
   */
  overlaps_from?: string;
  overlaps_to?: string;
}

export interface RecordBookingPaymentInput {
  amount: string;
  currency?: string;
  method?: "card" | "transfer" | "cash" | "other";
  reference?: string | null;
  /** When the money changed hands; omitted means now. */
  paid_at?: string | null;
  note?: string | null;
}

/** Fields a desk may correct without cancelling and re-taking the booking. */
export interface BookingUpdateInput {
  requester_name?: string;
  requester_email?: string;
  requester_phone?: string;
  guest_count?: number;
  purpose?: string;
  notes?: string;
  check_in_at?: string;
  check_out_at?: string;
}

/**
 * Something bought during the stay, posted to the guest's folio.
 *
 * Either an amount, or a quantity and a unit price — the server derives the line
 * total so the desk enters what the receipt says rather than doing arithmetic.
 */
export interface BookingChargeInput {
  description: string;
  category?: "room" | "service" | "charge";
  amount?: string;
  quantity?: string;
  unit_price?: string;
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
export function canDecide(
  booking: Pick<BookingDto, "status" | "domain">,
): boolean {
  if (booking.domain !== "residential" && booking.domain !== "hospitality") {
    return false;
  }
  return booking.status === "requested";
}

/**
 * A booking may be called off until the guest has arrived.
 *
 * Once checked in the arrangement has become an occupancy, and ending that is a
 * check-out. The server refuses these same statuses; this mirror exists so the
 * button is not offered for an action that will bounce.
 */
export function canCancel(booking: Pick<BookingDto, "status">): boolean {
  return (
    booking.status === "requested" ||
    booking.status === "pending_payment" ||
    booking.status === "confirmed"
  );
}
