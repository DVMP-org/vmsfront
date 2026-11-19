"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const MIN_REASON = 3;

/**
 * Confirming that a booking should be called off, with a reason the trail keeps.
 *
 * The server refuses a cancellation with no reason, so the confirm button mirrors
 * that rule instead of letting the request fail. The reason is not ceremony:
 * cancelling gives back a room that was sold and revokes a badge that worked, and
 * the only thing that will explain it later is this sentence.
 */
export function CancelBookingDialog({
  isOpen,
  onClose,
  onConfirm,
  pending,
  guestName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<unknown>;
  pending: boolean;
  guestName: string;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmed = reason.trim();

  async function confirm() {
    setError(null);
    try {
      await onConfirm(trimmed);
      setReason("");
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "That cancellation did not go through.",
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel this booking?"
      description={`${guestName}'s booking will be cancelled, its rooms released and any guest badge revoked. This cannot be undone.`}
      size="sm"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="cancel-booking-reason"
            className="text-xs font-medium text-[var(--vms-ink)]"
          >
            Why is it being cancelled?
          </label>
          <Input
            id="cancel-booking-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Guest's flight was cancelled"
          />
        </div>
        {error ? (
          <p
            role="alert"
            className="text-xs font-medium text-[var(--vms-danger)]"
          >
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={trimmed.length < MIN_REASON || pending}
            isLoading={pending}
            onClick={() => void confirm()}
          >
            Cancel booking
          </Button>
        </div>
      </div>
    </Modal>
  );
}
