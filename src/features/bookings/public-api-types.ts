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
}

export interface PublicBookingHost {
  id: string;
  display_name: string;
  /** The place this person may be visited at, so hosts follow the chosen unit. */
  place_id: string;
}

export interface PublicSiteBooking {
  site_id: string;
  site_name: string;
  site_slug: string;
  domain: string;
  timezone: string;
  stage: PublicBookingStage;
  requires_host: boolean;
  requires_place: boolean;
  places: PublicBookablePlace[];
  hosts: PublicBookingHost[];
}

export interface PublicBookingInput {
  kind: "booking" | "reservation";
  place_id: string | null;
  host_party_id: string | null;
  check_in_at: string;
  check_out_at: string;
  guest_count: number;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  purpose: string | null;
}

export interface PublicBookingCreated {
  id: string;
  status: string;
  kind: "booking" | "reservation";
  site_name: string;
  place_name: string | null;
  check_in_at: string;
  check_out_at: string;
  guest_count: number;
}

/** A visitor may hold a room without naming one only where reservations exist. */
export function canReserve(catalogue: PublicSiteBooking): boolean {
  return catalogue.stage === "reservation_allowed";
}
