"use client";

import { Drawer } from "@/components/ui/Drawer";
import { RecordPaymentForm } from "./RecordPaymentForm";

/**
 * The payment form in a drawer, for pages that are not already a drawer.
 *
 * The form itself is shared with the quick-view drawers, which open it in place
 * rather than stacking a second overlay on top of the first.
 */
export function RecordPaymentDialog({
    isOpen,
    onClose,
    bookingId,
    currency,
    balance,
}: {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    currency?: string;
    balance: string | null;
}) {
    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Record payment"
            description="Cash, transfer or POS taken outside the online checkout"
        >
            <RecordPaymentForm
                bookingId={bookingId}
                currency={currency}
                balance={balance}
                onDone={onClose}
                onCancel={onClose}
            />
        </Drawer>
    );
}

