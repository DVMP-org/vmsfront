"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { useHospitalityRooms } from "@/features/hospitality/queries";
import { ReservationStatusBadge } from "@/features/reservations/components/ReservationStatusBadge";
import {
  holdsReason,
  itemQuantityLabel,
  reservationWindow,
} from "@/features/reservations/lib";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import type { BookingDetailDto } from "../../api-types";
import { useAssignBookingRoom } from "../../queries";

/**
 * What the guest bought, and what is actually held for them.
 *
 * The two lists are deliberately separate. A line is money that was agreed; a
 * reservation is capacity that is blocked. They usually correspond, but a free
 * stay has a reservation and no line, and a cancelled booking keeps its line
 * while losing its hold — collapsing them into one list would hide both cases.
 */
export function BookingRoomsSection({
  booking,
}: {
  booking: BookingDetailDto;
}) {
  const assignRoom = useAssignBookingRoom(booking.id);
  const { data: rooms = [] } = useHospitalityRooms(
    booking.domain === "hospitality",
  );
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const needsRoom =
    booking.kind === "reservation" && booking.status === "requested";

  async function assign() {
    setError(null);
    try {
      await assignRoom.mutateAsync(roomId);
      setRoomId("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "That room could not be assigned.",
      );
    }
  }

  return (
    <section aria-label="Rooms and charges" className="flex flex-col gap-6">
      {needsRoom ? (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="booking-assign-room"
            className="text-xs font-semibold text-[var(--vms-ink)]"
          >
            Assign a room
          </label>
          <p className="text-xs text-[var(--vms-ink-muted)]">
            This reservation holds a room category without naming a room.
            Approval needs the room it will actually occupy.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <select
              id="booking-assign-room"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="min-h-11 min-w-48 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
            >
              <option value="">Choose a room…</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_number || room.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!roomId || assignRoom.isPending}
              isLoading={assignRoom.isPending}
              onClick={() => void assign()}
            >
              Assign room
            </Button>
          </div>
          {error ? (
            <p
              role="alert"
              className="text-xs font-medium text-[var(--vms-danger)]"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
          What was bought
        </h3>
        {booking.items.length === 0 ? (
          <PanelState
            kind="empty"
            compact
            title="Nothing priced yet"
            description="No rate was recorded, so there is nothing to charge for."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--vms-line)]">
            {booking.items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium text-[var(--vms-ink)]">
                    {item.name}
                  </span>
                  <span className="block text-xs text-[var(--vms-ink-muted)]">
                    {itemQuantityLabel(item.quantity, item.service_kind)}
                    {item.unit_price
                      ? ` · ${formatMoney(item.unit_price, item.currency)} each`
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 font-medium text-[var(--vms-ink)]">
                  {formatMoney(item.total, item.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
          Capacity held
        </h3>
        {booking.reservations.length === 0 ? (
          <PanelState
            kind="empty"
            compact
            title="Nothing is being held"
            description="This booking is not blocking any room."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {booking.reservations.map((reservation) => (
              <li
                key={reservation.id}
                className="flex flex-col gap-1 rounded-lg border border-[var(--vms-line)] px-3 py-2"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <ReservationStatusBadge status={reservation.status} />
                  {/* A row can say "Held" and still be blocking nothing. */}
                  {holdsReason(reservation) ? (
                    <span className="text-[10px] uppercase tracking-wide text-[var(--vms-ink-muted)]">
                      {holdsReason(reservation)}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-[var(--vms-ink-muted)]">
                  {reservationWindow(reservation)}
                </span>
                <span className="text-xs text-[var(--vms-ink-muted)]">
                  {reservation.place_id
                    ? "A specific room is assigned"
                    : humanize(reservation.place_type ?? "no room type")}
                  {reservation.expires_at
                    ? ` · hold ends ${formatDateTime(reservation.expires_at)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
