/**
 * Presentational helpers for capacity.
 *
 * Pure, so they can be tested without a table, and shared by the board and the
 * booking drawer so a reservation never reads differently in two places.
 */

import type { StatusTone } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/datetime";
import type { BookingStatus } from "@/features/bookings/types";
import type { ReservationDto, ReservationStatus } from "./api-types";

const toneByStatus: Record<ReservationStatus, StatusTone> = {
  held: "warning",
  confirmed: "info",
  completed: "neutral",
  expired: "neutral",
  cancelled: "neutral",
};

const labelByStatus: Record<ReservationStatus, string> = {
  held: "Held",
  confirmed: "Confirmed",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function reservationStatusTone(status: ReservationStatus): StatusTone {
  return toneByStatus[status] ?? "neutral";
}

export function reservationStatusLabel(status: ReservationStatus): string {
  return labelByStatus[status] ?? status;
}

/**
 * How this allocation is labelled to a person.
 *
 * A type-level hold has no room to name, and pretending otherwise ("Unassigned")
 * hides the thing the desk needs to act on: which category is being held, and
 * that it still needs a room.
 */
export function reservationResourceLabel(
  reservation: Pick<ReservationDto, "place_type">,
  placeName?: string | null,
): string {
  if (placeName) return placeName;
  if (reservation.place_type) return `${reservation.place_type} (no room yet)`;
  return "No resource";
}

/** "12 Mar 2027 → 15 Mar 2027" — the period held, in the desk's own terms. */
export function reservationWindow(
  reservation: Pick<ReservationDto, "start_at" | "end_at">,
): string {
  return `${formatDateTime(reservation.start_at)} → ${formatDateTime(
    reservation.end_at,
  )}`;
}

/**
 * Why a row is not blocking, when it is not.
 *
 * Returning the reason rather than a bare boolean keeps the UI from having to
 * re-derive the rule — and the rule depends on the clock, which only the server
 * decided.
 */
export function holdsReason(reservation: ReservationDto): string | null {
  if (reservation.is_holding) return null;
  if (reservation.status === "held") return "Hold lapsed";
  if (reservation.status === "cancelled") return "Released";
  if (reservation.status === "expired") return "Expired";
  if (reservation.status === "completed") return "Stayed";
  return "Not holding";
}

/** Items are priced server-side; the board never multiplies anything itself. */
export function itemQuantityLabel(
  quantity: string,
  serviceKind: string,
): string {
  const value = Number(quantity);
  if (!Number.isFinite(value)) return quantity;
  const noun =
    serviceKind === "accommodation"
      ? value === 1
        ? "night"
        : "nights"
      : value === 1
        ? "unit"
        : "units";
  return `${value} ${noun}`;
}

/**
 * A reservation's state, in the words a desk uses.
 *
 * Reservations are bookings whose room is not named yet, so they carry booking
 * statuses — but "requested" reads as "pending" to a person taking a call, and
 * "awaiting a deposit" is what `pending_payment` actually means here. There is no
 * "converted" status to map: conversion promotes the row to a booking, so it
 * leaves this directory rather than sitting in it labelled converted.
 */
const bookingStatusLabel: Record<BookingStatus, string> = {
  requested: "Pending",
  pending_payment: "Awaiting deposit",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  checked_in: "Checked in",
  checked_out: "Checked out",
  no_show: "No show",
  expired: "Expired",
};

export function reservationBookingStatusLabel(status: BookingStatus): string {
  return bookingStatusLabel[status] ?? status;
}

const bookingStatusTone: Record<BookingStatus, StatusTone> = {
  requested: "warning",
  pending_payment: "warning",
  confirmed: "info",
  declined: "danger",
  cancelled: "neutral",
  checked_in: "success",
  checked_out: "neutral",
  no_show: "danger",
  expired: "neutral",
};

export function reservationBookingStatusTone(
  status: BookingStatus,
): StatusTone {
  return bookingStatusTone[status] ?? "neutral";
}

/** The states the reservations directory offers as filters. */
export const RESERVATION_DIRECTORY_STATUSES: BookingStatus[] = [
  "requested",
  "pending_payment",
  "confirmed",
  "expired",
  "cancelled",
  "declined",
];

/** A reservation may be converted only while it is still awaiting a decision. */
export function canConvertReservation(
  reservation: Pick<{ kind: string; status: string }, "kind" | "status">,
): boolean {
  return reservation.kind === "reservation" && reservation.status === "requested";
}
