/**
 * The public booking endpoints, as an anonymous visitor sees them.
 *
 * Separate from `api-types.ts` because these answers carry no internal ids for
 * hosts beyond what a form needs, and because the visitor-facing contract is the
 * one place where "no place yet" is legitimate rather than an edge case.
 */

export type PublicBookingStage = "reservation_allowed" | "booking_only";

export interface PublicBookablePlace {
  id: string;
  name: string;
  kind: string;
  building_type: string | null;
  /**
   * A hospitality room is the priceable thing: it carries its own nightly rate,
   * currency, capacity and room type. Null for a space that is not sold by the
   * night, which is why every one of these is nullable rather than defaulted to
   * zero — zero is a price, absence is not.
   */
  nightly_rate: string | null;
  currency: string | null;
  capacity: number | null;
  room_type: string | null;
}

export interface PublicBookingHost {
  id: string;
  display_name: string;
  /** The place this person may be visited at, so hosts follow the chosen unit. */
  place_id: string;
}

/**
 * A type of room a hotel sells, which is what a guest actually chooses.
 *
 * The individual rooms are not offered: the hotel assigns one later. The count is
 * the only thing about inventory a guest needs.
 */
export interface PublicRoomCategory {
  id: string;
  name: string;
  description: string | null;
  nightly_rate: string | null;
  currency: string | null;
  capacity: number | null;
  rooms_total: number;
  /** Equals `rooms_total` until a dated search says otherwise. */
  rooms_available: number;
  /**
   * The nightly rate of each free room, cheapest first.
   *
   * `nightly_rate` is the cheapest of these. The list exists because two rooms of
   * one category can cost different amounts, and quoting the cheapest twice would
   * understate what two rooms actually come to.
   */
  rates: string[];
  amenities: string[];
}

/** What is left for the dates the guest asked about. */
export interface PublicAvailability {
  site_slug: string;
  check_in_at: string;
  check_out_at: string;
  nights: number;
  categories: PublicRoomCategory[];
}

export interface PublicSiteBooking {
  site_id: string;
  site_name: string;
  site_slug: string;
  site_description?: string | null;
  site_address?: string | null;
  domain: string;
  timezone: string;
  stage: PublicBookingStage;
  requires_host: boolean;
  requires_place: boolean;
  places: PublicBookablePlace[];
  /** Hospitality sells categories rather than rooms. Empty for other domains. */
  categories: PublicRoomCategory[];
  hosts: PublicBookingHost[];
}

export interface PublicBookingInput {
  kind: "booking" | "reservation";
  place_id: string | null;
  /** Set instead of `place_id` when the guest chose a category of room. */
  place_group_id?: string | null;
  /** How many rooms of that category. Ignored without `place_group_id`. */
  rooms?: number;
  host_party_id: string | null;
  check_in_at: string;
  check_out_at: string;
  guest_count?: number;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  purpose: string | null;
  /** Free text the guest left on the form; the property reads it on the booking. */
  notes?: string | null;
}

export interface PublicBookingCreated {
  id: string;
  status: string;
  kind: "booking" | "reservation";
  site_name: string;
  place_name: string | null;
  /** What a category booking bought, when it did not name a room. */
  room_category_name: string | null;
  rooms: number;
  check_in_at: string;
  check_out_at: string;
  guest_count: number;
  /** What the stay costs, priced by the server. Absent when the stay has no
   *  rate yet (a reservation holding no room), and `payable` says so. */
  nights: number | null;
  nightly_rate: string | null;
  currency: string | null;
  amount_due: string | null;
  payable: boolean;
  /**
   * True for a booking, which is paid for when it is made. False for a
   * reservation, which holds a room and may be paid for later or not at all.
   */
  payment_required: boolean;
  /** When the held room goes back if nothing is paid. */
  hold_expires_at: string | null;
}

/** A gateway hand-off, exactly as the payment provider returns it. */
export interface PublicBookingPayment {
  access_code: string;
  reference: string;
  authorization_url: string;
  status: string;
}

/** A visitor may hold a room without naming one only where reservations exist. */
export function canReserve(catalogue: PublicSiteBooking): boolean {
  return catalogue.stage === "reservation_allowed";
}
