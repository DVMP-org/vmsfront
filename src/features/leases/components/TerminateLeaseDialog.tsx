"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { parseApiError } from "@/lib/error-utils";

import type { Lease } from "../api";
import { useTerminateLease } from "../queries";

function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Ending a lease stops future billing without erasing what is already owed.
 *
 * Issued schedules are deliberately kept: a tenant who left owing two months
 * still owes them, and the arrears screen is the only place that can collect.
 */
export function TerminateLeaseDialog({
  isOpen,
  onClose,
  siteId,
  lease,
}: {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string | null;
  lease: Lease | null;
}) {
  const [terminatedOn, setTerminatedOn] = useState(today);
  const [reason, setReason] = useState("");
  const [endCharges, setEndCharges] = useState(true);
  const mutation = useTerminateLease(siteId);

  useEffect(() => {
    if (!isOpen) return;
    setTerminatedOn(today());
    setReason("");
    setEndCharges(true);
    mutation.reset();
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!lease) return null;

  const isDraft = lease.status === "draft" || lease.status === "pending_signature";

  function submit() {
    mutation.mutate(
      {
        id: lease!.id,
        terminated_on: terminatedOn,
        reason: reason || null,
        end_charges: endCharges,
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDraft ? "Cancel this draft lease" : "Terminate this lease"}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={mutation.isPending}
          >
            {isDraft ? "Cancel draft" : "Terminate lease"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--vms-ink-muted)]">
          {isDraft
            ? "Nothing has been billed, so this draft will be marked cancelled."
            : "Charges stop on the date you choose. Anything already invoiced stays outstanding and can still be collected."}
        </p>

        {mutation.isError ? (
          <p
            role="alert"
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]"
          >
            {parseApiError(mutation.error).message}
          </p>
        ) : null}

        <Field id="terminate-on" label="Ends on" required>
          {(control) => (
            <input
              {...control}
              type="date"
              className={fieldControlClassName}
              value={terminatedOn}
              onChange={(event) => setTerminatedOn(event.target.value)}
            />
          )}
        </Field>

        <Field id="terminate-reason" label="Reason">
          {(control) => (
            <textarea
              {...control}
              className={fieldControlClassName}
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tenant handed the space back"
            />
          )}
        </Field>

        {!isDraft ? (
          <Switch
            checked={endCharges}
            onChange={setEndCharges}
            label="End the charges this lease created"
            description="Off leaves them billing. Only do that if the party still owes for the space."
          />
        ) : null}
      </div>
    </Modal>
  );
}
