"use client";

import { useParams } from "next/navigation";

import { ReservationDetailScreen } from "@/features/reservations/components/ReservationDetailScreen";

/**
 * One reservation, at its own address.
 *
 * A real route rather than only a drawer because this is where a reservation is
 * actually worked: the holds, the payments and the decision to confirm it. The id
 * comes from the path so it can be linked and reloaded; the API client still
 * attaches the selected Site, so a link cannot open another Site's reservation.
 */
export default function AdminReservationDetailPage() {
    const params = useParams<{ bookingId: string }>();
    const bookingId =
        typeof params.bookingId === "string" ? params.bookingId : "";

    if (!bookingId) {
        return null;
    }

    return <ReservationDetailScreen bookingId={bookingId} />;
}
