/**
 * The reservations API, as the desk sees it.
 *
 * Reservations are kept apart from bookings on purpose. A booking is what a
 * guest bought; a reservation is capacity held for a period, and the same booking
 * can hold several. Asking "what is holding Room 204 this weekend" should not
 * require reading a register of sales.
 */

export type ReservationStatus =
  | "held"
  | "confirmed"
  | "completed"
  | "expired"
  | "cancelled";

export interface ReservationDto {
  id: string;
  site_id: string;
  booking_id: string | null;
  booking_item_id: string | null;
  /** The physical room, once one has been chosen. */
  place_id: string | null;
  /** The category held, when no physical room has been chosen yet. */
  place_type: string | null;
  start_at: string;
  end_at: string;
  status: ReservationStatus;
  expires_at: string | null;
  notes: string | null;
  /**
   * Whether this row occupies capacity *now*.
   *
   * Computed by the server, because it depends on the clock as well as the
   * status: a `held` row past its expiry blocks nothing even before a sweep
   * marks it expired. Deriving this from `status` in the client would draw a
   * lapsed hold as an occupied room.
   */
  is_holding: boolean;
}

export interface ReservationListParams {
  page?: number;
  page_size?: number;
  status?: ReservationStatus;
  place_id?: string;
  place_type?: string;
  /**
   * An **overlap** filter on the allocation interval, not a creation-date filter.
   * Anything whose period intersects the window is returned, including an
   * allocation that started before it. Half-open, so a check-out morning does
   * not collide with the same day's check-in.
   */
  overlaps_from?: string;
  overlaps_to?: string;
}

export interface ReservationReleaseInput {
  status: "cancelled" | "expired" | "completed";
}

/** A booking item, priced when it was bought. */
export interface BookingItemDto {
  id: string;
  booking_id: string;
  name: string;
  service_kind: string;
  quantity: string;
  unit_price: string;
  currency: string;
  total: string;
  notes: string | null;
}

export const RESERVATION_STATUSES: ReservationStatus[] = [
  "held",
  "confirmed",
  "completed",
  "expired",
  "cancelled",
];
