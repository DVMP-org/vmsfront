"use client";

import { useParams } from "next/navigation";

import { BookingDetailScreen } from "@/features/bookings/components/BookingDetailScreen";

/**
 * One booking, at its own address.
 *
 * A real route rather than a drawer because a booking is something a desk
 * returns to, links to a colleague, and keeps open while answering a call. The
 * id comes from the path so the page is shareable; the API client still attaches
 * the selected Site, so a link can only ever open a booking at the Site the
 * reader is currently in.
 */
export default function AdminBookingDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId =
    typeof params.bookingId === "string" ? params.bookingId : "";

  if (!bookingId) {
    return null;
  }

  return <BookingDetailScreen bookingId={bookingId} />;
}
