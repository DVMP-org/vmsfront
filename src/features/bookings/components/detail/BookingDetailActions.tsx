"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BookingApprovalActions } from "../BookingApprovalActions";
import { CancelBookingDialog } from "./CancelBookingDialog";
import { canCancel, canDecide } from "../../api-types";
import type { BookingDetailDto } from "../../api-types";
import { useApproveBooking, useCancelBooking, useDeclineBooking } from "../../queries";

/**
 * Everything an operator may do to this booking, and nothing they may not.
 *
 * The buttons are gated by what the booking is, not by what the page hopes: an
 * undecided booking can be approved or declined, an agreed one can be cancelled,
 * and a reservation cannot be approved before it names a room. Offering an action
 * that the server will refuse is worse than hiding it, because the refusal
 * arrives as an error rather than as an explanation.
 */
export function BookingDetailActions({ booking }: { booking: BookingDetailDto }) {
  const approve = useApproveBooking(booking.id);
  const decline = useDeclineBooking(booking.id);
  const cancel = useCancelBooking(booking.id);

  const [declining, setDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsRoom = booking.kind === "reservation" && booking.status === "requested";
  const decidable = canDecide(booking) && !needsRoom;
  const cancellable = canCancel(booking);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      setDeclining(false);
      setDeclineReason("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "That action did not go through.",
      );
    }
  }

  if (!decidable && !cancellable && !needsRoom) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {decidable ? (
          <BookingApprovalActions
            pending={approve.isPending || decline.isPending}
            onApprove={() => void run(() => approve.mutateAsync(undefined))}
            onDecline={() => setDeclining(true)}
          />
        ) : null}
        {cancellable ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCancelling(true)}
          >
            Cancel booking
          </Button>
        ) : null}
      </div>

      {declining ? (
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--vms-line)] px-3 py-2">
          <label
            htmlFor="booking-decline-reason"
            className="text-xs font-medium text-[var(--vms-ink)]"
          >
            Why is this declined?
          </label>
          <Input
            id="booking-decline-reason"
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
            placeholder="Away that week"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setDeclining(false)}
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={declineReason.trim().length < 3 || decline.isPending}
              isLoading={decline.isPending}
              onClick={() => void run(() => decline.mutateAsync(declineReason.trim()))}
            >
              Confirm decline
            </Button>
          </div>
        </div>
      ) : null}

      {needsRoom ? (
        <p className="rounded-lg border border-[var(--vms-line)] px-3 py-2 text-xs text-[var(--vms-ink-muted)]">
          A reservation has to name a room before it can be approved. Assign one on
          the Rooms tab.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
          {error}
        </p>
      ) : null}

      <CancelBookingDialog
        isOpen={cancelling}
        onClose={() => setCancelling(false)}
        onConfirm={(reason) => cancel.mutateAsync(reason)}
        pending={cancel.isPending}
        guestName={booking.requester_name}
      />
    </div>
  );
}
