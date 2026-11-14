import { StatusBadge } from "@/components/ui/StatusBadge";
import { reservationStatusLabel, reservationStatusTone } from "../lib";
import type { ReservationStatus } from "../api-types";

/**
 * Atomic status pill for a reservation.
 *
 * Tone and label come from one mapping so the board and the booking drawer can
 * never disagree about what a state is called or how urgent it looks.
 */
export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  return (
    <StatusBadge tone={reservationStatusTone(status)}>
      {reservationStatusLabel(status)}
    </StatusBadge>
  );
}
