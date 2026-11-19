"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toDateTimeInputValue } from "@/lib/datetime";
import type { BookingDetailDto, BookingUpdateInput } from "../api-types";
import { useUpdateBooking } from "../queries";

const RESCHEDULABLE = new Set(["requested", "pending_payment", "confirmed"]);

/**
 * Correcting a booking instead of cancelling and re-taking it.
 *
 * Only what changed is sent, so an edit to the phone number cannot quietly
 * overwrite dates somebody else moved a minute ago. Dates are offered only while
 * the arrangement has not started: once a guest is in the room the stay owns
 * them, and the server refuses the change rather than moving a room under
 * somebody's feet.
 */
export function BookingEditForm({
    booking,
    onDone,
    onCancel,
}: {
    booking: BookingDetailDto;
    onDone?: () => void;
    onCancel?: () => void;
}) {
    const update = useUpdateBooking(booking.id);
    const canMove = RESCHEDULABLE.has(booking.status);

    const [name, setName] = useState(booking.requester_name);
    const [email, setEmail] = useState(booking.requester_email ?? "");
    const [phone, setPhone] = useState(booking.requester_phone ?? "");
    const [guestCount, setGuestCount] = useState(String(booking.guest_count));
    const [purpose, setPurpose] = useState(booking.purpose ?? "");
    const [notes, setNotes] = useState("");
    const [checkIn, setCheckIn] = useState(
        toDateTimeInputValue(booking.check_in_at),
    );
    const [checkOut, setCheckOut] = useState(
        toDateTimeInputValue(booking.check_out_at),
    );
    const [error, setError] = useState<string | null>(null);

    async function submit() {
        setError(null);
        const changes: BookingUpdateInput = {};
        if (name.trim() !== booking.requester_name) changes.requester_name = name.trim();
        if (email.trim() !== (booking.requester_email ?? "")) {
            changes.requester_email = email.trim();
        }
        if (phone.trim() !== (booking.requester_phone ?? "")) {
            changes.requester_phone = phone.trim();
        }
        if (Number(guestCount) !== booking.guest_count) {
            changes.guest_count = Number(guestCount);
        }
        if (purpose.trim() !== (booking.purpose ?? "")) changes.purpose = purpose.trim();
        if (notes.trim()) changes.notes = notes.trim();
        if (canMove) {
            const startIso = checkIn ? new Date(checkIn).toISOString() : undefined;
            const endIso = checkOut ? new Date(checkOut).toISOString() : undefined;
            if (startIso && startIso !== new Date(booking.check_in_at).toISOString()) {
                changes.check_in_at = startIso;
            }
            if (endIso && endIso !== new Date(booking.check_out_at).toISOString()) {
                changes.check_out_at = endIso;
            }
        }

        if (Object.keys(changes).length === 0) {
            onCancel?.();
            return;
        }

        try {
            await update.mutateAsync(changes);
            onDone?.();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "That booking could not be saved.",
            );
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="edit-booking-name"
                        className="text-xs font-medium text-[var(--vms-ink)]"
                    >
                        Guest name
                    </label>
                    <Input
                        id="edit-booking-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="edit-booking-guests"
                        className="text-xs font-medium text-[var(--vms-ink)]"
                    >
                        Guests
                    </label>
                    <Input
                        id="edit-booking-guests"
                        inputMode="numeric"
                        value={guestCount}
                        onChange={(event) => setGuestCount(event.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="edit-booking-email"
                        className="text-xs font-medium text-[var(--vms-ink)]"
                    >
                        Email
                    </label>
                    <Input
                        id="edit-booking-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="edit-booking-phone"
                        className="text-xs font-medium text-[var(--vms-ink)]"
                    >
                        Phone
                    </label>
                    <Input
                        id="edit-booking-phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="edit-booking-purpose"
                    className="text-xs font-medium text-[var(--vms-ink)]"
                >
                    Purpose <span className="font-normal">(optional)</span>
                </label>
                <Input
                    id="edit-booking-purpose"
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                />
            </div>

            {canMove ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="edit-booking-check-in"
                            className="text-xs font-medium text-[var(--vms-ink)]"
                        >
                            Check-in
                        </label>
                        <Input
                            id="edit-booking-check-in"
                            type="datetime-local"
                            value={checkIn}
                            onChange={(event) => setCheckIn(event.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="edit-booking-check-out"
                            className="text-xs font-medium text-[var(--vms-ink)]"
                        >
                            Check-out
                        </label>
                        <Input
                            id="edit-booking-check-out"
                            type="datetime-local"
                            value={checkOut}
                            onChange={(event) => setCheckOut(event.target.value)}
                        />
                    </div>
                    <p className="text-[11px] text-[var(--vms-ink-muted)] sm:col-span-2">
                        Moving the dates moves the room hold with them, and is refused if the
                        room is taken for the new nights.
                    </p>
                </div>
            ) : (
                <p className="rounded-lg border border-[var(--vms-line)] px-3 py-2 text-xs text-[var(--vms-ink-muted)]">
                    This stay has started, so its dates belong to the stay and cannot be
                    changed here. Guest details can still be corrected.
                </p>
            )}

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="edit-booking-note"
                    className="text-xs font-medium text-[var(--vms-ink)]"
                >
                    Note <span className="font-normal">(optional)</span>
                </label>
                <Input
                    id="edit-booking-note"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Added to the booking's notes"
                />
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
                    isLoading={update.isPending}
                    onClick={() => void submit()}
                >
                    Save changes
                </Button>
            </div>
        </div>
    );
}
