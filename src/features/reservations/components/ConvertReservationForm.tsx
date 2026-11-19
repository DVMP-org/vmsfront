"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useConvertReservation } from "@/features/bookings/queries";
import { useHospitalityRooms } from "@/features/hospitality/queries";

/**
 * Confirming a reservation into a booking, for every room it needs.
 *
 * The server allocates the rooms, promotes the reservation and approves it in
 * that order, so this form only has to answer one question: which rooms? A
 * reservation taken for a named room already answers it; that room is shown
 * locked and more can be added beside it.
 *
 * The list is deliberately explicit rather than a "number of rooms" spinner: a
 * count is not a booking, and the desk is the only one who knows that the family
 * wants the two rooms facing the garden.
 */
export function ConvertReservationForm({
    bookingId,
    initialRoomIds = [],
    onDone,
    onCancel,
}: {
    bookingId: string;
    initialRoomIds?: string[];
    onDone?: () => void;
    onCancel?: () => void;
}) {
    const rooms = useHospitalityRooms();
    const convert = useConvertReservation(bookingId);
    const [selected, setSelected] = useState<string[]>(initialRoomIds);
    const [error, setError] = useState<string | null>(null);

    const locked = new Set(initialRoomIds);
    const valid = selected.length > 0;

    function toggle(roomId: string) {
        if (locked.has(roomId)) return;
        setSelected((current) =>
            current.includes(roomId)
                ? current.filter((id) => id !== roomId)
                : [...current, roomId],
        );
    }

    async function submit() {
        setError(null);
        try {
            await convert.mutateAsync(selected);
            onDone?.();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "That reservation could not be converted.",
            );
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-1 rounded-lg border border-[var(--vms-line)] px-3 py-2 text-xs text-[var(--vms-ink-muted)]">
                <li>The guest and stay dates carry over unchanged.</li>
                <li>Every room is allocated for the whole stay, or none is.</li>
                <li>
                    Deposits already taken are posted to the guest&apos;s bill — not charged
                    again.
                </li>
                <li>
                    The reservation becomes a booking and moves out of this register; the
                    activity trail keeps the link back to it.
                </li>
            </ul>

            <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-[var(--vms-ink)]">
                        Rooms
                    </span>
                    <span className="text-[11px] text-[var(--vms-ink-muted)]">
                        {selected.length} selected
                    </span>
                </div>
                {rooms.isPending ? (
                    <p className="text-xs text-[var(--vms-ink-muted)]">Loading rooms…</p>
                ) : (
                    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--vms-line)] p-1">
                        {(rooms.data ?? []).map((room) => {
                            const isLocked = locked.has(room.id);
                            const isSelected = selected.includes(room.id);
                            return (
                                <li key={room.id}>
                                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm hover:bg-[var(--vms-surface-subtle)]">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            disabled={isLocked}
                                            onChange={() => toggle(room.id)}
                                            className="h-4 w-4 rounded border-[var(--vms-border)]"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium">
                                                {room.room_number || room.name}
                                            </span>
                                            <span className="block text-[11px] text-[var(--vms-ink-muted)]">
                                                {room.place_group_name ?? room.room_type}
                                                {isLocked ? " · already on this reservation" : ""}
                                            </span>
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <p className="text-[11px] text-[var(--vms-ink-muted)]">
                    Availability is checked when you confirm; a room that has gone since
                    this page loaded stops the conversion rather than half-confirming it.
                </p>
            </div>

            {error ? (
                <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
                    {error}
                </p>
            ) : null}

            <div className="flex items-center justify-end gap-2">
                {onCancel ? (
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                        Back
                    </Button>
                ) : null}
                <Button
                    type="button"
                    size="sm"
                    disabled={!valid || convert.isPending}
                    isLoading={convert.isPending}
                    onClick={() => void submit()}
                >
                    Convert to booking
                </Button>
            </div>
        </div>
    );
}
