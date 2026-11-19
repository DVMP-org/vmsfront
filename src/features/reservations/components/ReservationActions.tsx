"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { useHospitalityRooms } from "@/features/hospitality/queries";
import { parseApiError } from "@/lib/error-utils";
import {
  useAllocateReservation,
  useConfirmReservation,
  useReleaseReservation,
} from "../queries";
import type { ReservationDto } from "../api-types";

/**
 * The three things a desk can do to capacity.
 *
 * Which ones appear is driven by the row, not by a guess: confirming only means
 * something for a *held* reservation, and allocation only means something for a
 * type-level hold that has no room yet. Showing a disabled button for the other
 * cases would leave an operator wondering what they were being prevented from
 * doing.
 *
 * Releasing asks for confirmation, because it puts a room back on sale and a
 * misclick is not obviously reversible.
 */
export function ReservationActions({
  reservation,
}: {
  reservation: ReservationDto;
}) {
  const [releasing, setReleasing] = useState(false);
  const [roomId, setRoomId] = useState("");
  const rooms = useHospitalityRooms();
  const confirm = useConfirmReservation();
  const allocate = useAllocateReservation();
  const release = useReleaseReservation();

  const pending = confirm.isPending || allocate.isPending || release.isPending;
  const error = confirm.error ?? allocate.error ?? release.error;
  // A lapsed hold cannot be confirmed: it stopped blocking, so the room may
  // already be sold. The server refuses it too — this only keeps the button off
  // the screen rather than inviting a refusal.
  const canConfirm = reservation.status === "held" && reservation.is_holding;
  const needsRoom = Boolean(reservation.place_type) && !reservation.place_id;
  const canRelease =
    reservation.status === "held" || reservation.status === "confirmed";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {canConfirm ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            aria-busy={confirm.isPending}
            onClick={() => confirm.mutate(reservation.id)}
          >
            Confirm
          </Button>
        ) : null}

        {needsRoom ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
              <span className="sr-only">Assign a room</span>
              <select
                className="min-h-11 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] px-3 text-sm"
                value={roomId}
                onChange={(event) => setRoomId(event.currentTarget.value)}
                aria-label={`Assign a room for the ${reservation.place_type} hold`}
              >
                <option value="">Choose a room…</option>
                {(rooms.data ?? []).map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || !roomId}
              aria-busy={allocate.isPending}
              onClick={() =>
                allocate.mutate({
                  reservationId: reservation.id,
                  placeId: roomId,
                })
              }
            >
              Assign
            </Button>
          </div>
        ) : null}

        {canRelease ? (
          releasing ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--vms-ink-muted)]">
                Put the room back on sale?
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setReleasing(false)}
              >
                Keep it
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                aria-busy={release.isPending}
                onClick={() =>
                  release.mutate({ reservationId: reservation.id })
                }
              >
                Release
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => setReleasing(true)}
            >
              Release
            </Button>
          )
        ) : null}
      </div>

      {error ? (
        <InlineAlert tone="danger">{parseApiError(error).message}</InlineAlert>
      ) : null}
    </div>
  );
}
