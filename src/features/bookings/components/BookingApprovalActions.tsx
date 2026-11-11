"use client";

import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/Button";

/**
 * Atomic approve/decline actions for a pending booking.
 *
 * Presentational only: it renders buttons and invokes the supplied callbacks.
 * It does not perform any request itself, so callers control the mutation.
 */
export function BookingApprovalActions({
  pending = false,
  onApprove,
  onDecline,
}: {
  pending?: boolean;
  onApprove?: () => void;
  onDecline?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={onDecline}
      >
        <X className="h-4 w-4" aria-hidden="true" />
        Decline
      </Button>
      <Button type="button" size="sm" disabled={pending} onClick={onApprove}>
        <Check className="h-4 w-4" aria-hidden="true" />
        Approve
      </Button>
    </div>
  );
}
