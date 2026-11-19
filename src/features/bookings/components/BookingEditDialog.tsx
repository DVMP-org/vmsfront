"use client";

import { Drawer } from "@/components/ui/Drawer";
import { BookingEditForm } from "./BookingEditForm";
import type { BookingDetailDto } from "../api-types";

/** The edit form in a drawer, for pages that are not already a drawer. */
export function BookingEditDialog({
    isOpen,
    onClose,
    booking,
}: {
    isOpen: boolean;
    onClose: () => void;
    booking: BookingDetailDto;
}) {
    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Edit booking"
            description={booking.reference ?? booking.requester_name}
        >
            <BookingEditForm booking={booking} onDone={onClose} onCancel={onClose} />
        </Drawer>
    );
}
