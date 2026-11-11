import { StatusBadge } from "@/components/ui/StatusBadge";
import { bookingStatusLabel, bookingStatusTone } from "../lib";
import type { BookingStatus } from "../types";

/**
 * Atomic status pill for a booking.
 *
 * The tone is derived from the status so every surface renders the same colour
 * and label without duplicating the mapping.
 */
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <StatusBadge tone={bookingStatusTone(status)}>
      {bookingStatusLabel(status)}
    </StatusBadge>
  );
}
