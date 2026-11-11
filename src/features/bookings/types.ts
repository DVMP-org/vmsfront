/**
 * Bookings & reservations — presentational contract.
 *
 * These types describe the shape of a booking for the UI layer only. They are
 * intentionally decoupled from any transport until the canonical bookings API
 * exists; do not wire them to live requests yet.
 */

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "checked_in"
  | "checked_out"
  | "no_show"
  | "expired";

export type BookingKind = "reservation" | "booking";

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
