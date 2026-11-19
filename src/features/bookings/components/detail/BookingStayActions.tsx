"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useSiteAccess } from "@/features/context/use-site-access";
import { useCheckInStay, useCheckOutStay } from "@/features/hospitality/queries";
import { parseApiError } from "@/lib/error-utils";
import type { BookingDetailDto } from "../../api-types";

/**
 * Arrive and depart, from the booking that opened the stay.
 *
 * The stay is what actually changes state, so these buttons act on its id rather
 * than inventing a booking status of their own. Only the transition the server
 * will accept is offered: a guest who has arrived is not offered check-in again,
 * and nobody is offered check-in before the booking is confirmed.
 */
export function BookingStayActions({ booking }: { booking: BookingDetailDto }) {
    const access = useSiteAccess();
    const checkIn = useCheckInStay();
    const checkOut = useCheckOutStay();
    const [error, setError] = useState<string | null>(null);

    const stayId = booking.hospitality_stay_id ?? null;
    if (!stayId) {
        return null;
    }

    const canCheckIn =
        booking.status === "confirmed" &&
        booking.hospitality_stay_status === "reserved" &&
        access.allowed("hospitality_stays.checkin");
    const canCheckOut =
        booking.hospitality_stay_status === "checked_in" &&
        access.allowed("hospitality_stays.checkout");

    if (!canCheckIn && !canCheckOut) {
        return null;
    }

    async function run(action: () => Promise<unknown>) {
        setError(null);
        try {
            await action();
        } catch (cause) {
            setError(parseApiError(cause).message);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
                {canCheckIn ? (
                    <Button
                        type="button"
                        size="sm"
                        isLoading={checkIn.isPending}
                        onClick={() => void run(() => checkIn.mutateAsync(stayId))}
                    >
                        Check in guest
                    </Button>
                ) : null}
                {canCheckOut ? (
                    <Button
                        type="button"
                        size="sm"
                        isLoading={checkOut.isPending}
                        onClick={() => void run(() => checkOut.mutateAsync(stayId))}
                    >
                        Check out guest
                    </Button>
                ) : null}
            </div>
            {error ? (
                <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
