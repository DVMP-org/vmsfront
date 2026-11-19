"use client";

import { Drawer } from "@/components/ui/Drawer";
import { AddChargeForm } from "./AddChargeForm";

/**
 * The charge form in a drawer, for pages that are not already a drawer.
 *
 * The form itself is shared with the quick-view drawers, which open it in place
 * rather than stacking a second overlay.
 */
export function AddChargeDialog({
    isOpen,
    onClose,
    bookingId,
    currency,
}: {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    currency?: string;
}) {
    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Add a charge"
            description="Something bought during the stay, added to the guest's bill"
        >
            <AddChargeForm
                bookingId={bookingId}
                currency={currency}
                onDone={onClose}
                onCancel={onClose}
            />
        </Drawer>
    );
}

