/**
 * Bookings & reservations — presentational contract.
 *
 * These types describe the shape of a booking for the UI layer only. They are
 * intentionally decoupled from any transport until the canonical bookings API
 * exists; do not wire them to live requests yet.
 */

export type BookingStatus =
  | "pending_payment"
  | "requested"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "checked_in"
  | "checked_out"
  | "no_show"
  | "expired";

export type BookingKind = "reservation" | "booking";

/**
 * How a booking reached the Site.
 *
 * `public` is the Site's own booking page and is the default, so a row that
 * never says otherwise came from there. The other three are staff taking a
 * booking on someone's behalf, which is the one fact a public form cannot
 * produce.
 */
export type BookingSource = "public" | "phone" | "walk_in" | "staff";

export type BookingDomain =
  | "residential"
  | "commercial"
  | "mixed_use"
  | "hospitality";

export interface BookingRequester {
  name: string;
  email: string | null;
  phone: string | null;
}

export interface BookingSummary {
  id: string;
  kind: BookingKind;
  domain: BookingDomain;
  status: BookingStatus;
  placeName: string;
  hostName: string | null;
  requester: BookingRequester;
  checkInAt: string;
  checkOutAt: string;
  guestCount: number;
  purpose: string | null;
}
