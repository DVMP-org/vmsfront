"use client";

import { Drawer } from "@/components/ui/Drawer";
import { ConvertReservationForm } from "./ConvertReservationForm";

/**
 * The conversion form in a drawer, for pages that are not already a drawer.
 *
 * The form is shared with the reservation drawers and details page, which open it
 * in place rather than stacking a second overlay.
 */
export function ConvertReservationDialog({
    isOpen,
    onClose,
    bookingId,
    guestName,
    initialRoomIds = [],
}: {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    guestName: string;
    initialRoomIds?: string[];
}) {
    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Convert to booking"
            description={`Confirm ${guestName}'s reservation`}
        >
            <ConvertReservationForm
                bookingId={bookingId}
                initialRoomIds={initialRoomIds}
                onDone={onClose}
                onCancel={onClose}
            />
        </Drawer>
    );
}

