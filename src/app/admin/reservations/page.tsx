import { ReservationsBoard } from "@/features/reservations/components";

/**
 * The Site's reservations register.
 *
 * A page of its own rather than a tab on bookings: capacity and sales are
 * different questions, and the Site comes from the API client's selected Site so
 * this cannot show another Site's allocations.
 */
export default function ReservationsPage() {
  return <ReservationsBoard />;
}
