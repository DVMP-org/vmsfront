"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer } from "@/components/ui/form/FormDrawer";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { FormSection } from "@/components/ui/form/FormSection";
import { Switch } from "@/components/ui/Switch";
import { parseApiError } from "@/lib/error-utils";

import type { Contractor, ContractorStatus } from "../api";
import { contractorStatusLabel } from "../lib";
import { useUpdateContractor } from "../queries";

const MANAGEABLE_STATUSES: ContractorStatus[] = [
  "invited",
  "active",
  "suspended",
  "expired",
  "revoked",
];

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDateInput(value: string | null): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

interface Draft {
  access_from: string;
  access_to: string;
  status: ContractorStatus;
  requires_permit: boolean;
  permit_reference: string;
  permit_expires_at: string;
  purpose: string;
  notes: string;
}

function draftFrom(contractor: Contractor): Draft {
  return {
    access_from: toLocalInput(contractor.access_from),
    access_to: toLocalInput(contractor.access_to),
    status: contractor.status,
    requires_permit: contractor.requires_permit,
    permit_reference: contractor.permit_reference ?? "",
    permit_expires_at: toDateInput(contractor.permit_expires_at),
    purpose: contractor.purpose ?? "",
    notes: contractor.notes ?? "",
  };
}

/**
 * Lifecycle panel for a Site contractor: extend or shorten the window, change
 * permit state, and move between invited, active, suspended and revoked.
 */
export function EditContractorDrawer({
  contractor,
  siteId,
  onClose,
}: {
  contractor: Contractor | null;
  siteId?: string | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useUpdateContractor(siteId);

  useEffect(() => {
    if (!contractor) {
      setDraft(null);
      return;
    }
    setDraft(draftFrom(contractor));
    setErrors({});
    mutation.reset();
    // Reset only when the record changes; typing must not reset the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractor?.id]);

  if (!contractor || !draft) return null;

  function update<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contractor || !draft) return;
    const next: Record<string, string> = {};
    if (!draft.access_from || !draft.access_to) {
      next.access_to = "Set when the contractor may be on Site.";
    } else if (
      new Date(draft.access_to).getTime() <= new Date(draft.access_from).getTime()
    ) {
      next.access_to = "Access must end after it starts.";
    }
    if (draft.requires_permit) {
      if (!draft.permit_reference.trim()) {
        next.permit_reference = "Record the permit reference.";
      }
      if (!draft.permit_expires_at) {
        next.permit_expires_at = "Record when the permit expires.";
      }
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    mutation.mutate(
      {
        id: contractor.id,
        status: draft.status,
        access_from: new Date(draft.access_from).toISOString(),
        access_to: new Date(draft.access_to).toISOString(),
        requires_permit: draft.requires_permit,
        permit_reference: draft.requires_permit
          ? draft.permit_reference.trim()
          : null,
        permit_expires_at:
          draft.requires_permit && draft.permit_expires_at
            ? new Date(draft.permit_expires_at).toISOString()
            : null,
        purpose: draft.purpose.trim() || null,
        notes: draft.notes.trim() || null,
      },
      { onSuccess: onClose },
    );
  }

  const serverError = mutation.error ? parseApiError(mutation.error).message : null;
  const terminal = contractor.status === "revoked";

  return (
    <FormDrawer
      isOpen
      onClose={onClose}
      title={`Manage ${contractor.contact_name}`}
      description={`${contractor.company_name || contractor.email} · registered for this Site`}
      onSubmit={submit}
      submitLabel="Save contractor"
      isSubmitting={mutation.isPending}
      canSubmit={!terminal}
      error={serverError}
      footerNote={
        terminal
          ? "Revoked contractors are read-only records kept for audit."
          : "Changes apply to the next gate scan; the contractor is not re-invited."
      }
    >
      <FormErrorSummary errors={errors} />

      <FormSection
        title="Access window"
        description="The gate honours this window only; extend it before the current one ends."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contractor-edit-from" label="Allowed from" required>
            {(control) => (
              <input
                {...control}
                type="datetime-local"
                className={fieldControlClassName}
                value={draft.access_from}
                onChange={(event) => update("access_from", event.target.value)}
                disabled={terminal}
              />
            )}
          </Field>
          <Field
            id="contractor-edit-to"
            label="Allowed until"
            required
            error={errors.access_to}
          >
            {(control) => (
              <input
                {...control}
                type="datetime-local"
                className={fieldControlClassName}
                value={draft.access_to}
                onChange={(event) => update("access_to", event.target.value)}
                disabled={terminal}
              />
            )}
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              type="button"
              variant="outline"
              size="sm"
              disabled={terminal}
              onClick={() => {
                const end = new Date();
                end.setDate(end.getDate() + days);
                end.setHours(18, 0, 0, 0);
                update("access_to", toLocalInput(end.toISOString()));
              }}
            >
              +{days} days
            </Button>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Status"
        description="Suspending stops new scans without deleting the record."
      >
        <Field id="contractor-edit-status" label="Contractor status">
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={draft.status}
              onChange={(event) =>
                update("status", event.target.value as ContractorStatus)
              }
              disabled={terminal}
            >
              {MANAGEABLE_STATUSES.filter(
                (status) =>
                  status !== "revoked" || contractor.status === "revoked",
              ).map((status) => (
                <option key={status} value={status}>
                  {contractorStatusLabel(status)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </FormSection>

      <FormSection
        title="Permit"
        description="Permit details appear on the contractor's invitation."
        icon={ShieldCheck}
      >
        <Switch
          checked={draft.requires_permit}
          onChange={(next) => update("requires_permit", next)}
          label="Permit required"
          description="Turn off only when the Site no longer requires a permit."
          disabled={terminal}
        />
        {draft.requires_permit ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="contractor-edit-permit-reference"
              label="Permit reference"
              required
              error={errors.permit_reference}
            >
              {(control) => (
                <input
                  {...control}
                  className={fieldControlClassName}
                  value={draft.permit_reference}
                  onChange={(event) =>
                    update("permit_reference", event.target.value)
                  }
                  disabled={terminal}
                />
              )}
            </Field>
            <Field
              id="contractor-edit-permit-expiry"
              label="Permit expires"
              required
              error={errors.permit_expires_at}
            >
              {(control) => (
                <input
                  {...control}
                  type="date"
                  className={fieldControlClassName}
                  value={draft.permit_expires_at}
                  onChange={(event) =>
                    update("permit_expires_at", event.target.value)
                  }
                  disabled={terminal}
                />
              )}
            </Field>
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Context" description="Internal notes for the site team.">
        <Field id="contractor-edit-purpose" label="Purpose">
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={draft.purpose}
              onChange={(event) => update("purpose", event.target.value)}
              disabled={terminal}
            />
          )}
        </Field>
        <Field id="contractor-edit-notes" label="Notes">
          {(control) => (
            <textarea
              {...control}
              className={`${fieldControlClassName} resize-none`}
              rows={3}
              value={draft.notes}
              onChange={(event) => update("notes", event.target.value)}
              disabled={terminal}
            />
          )}
        </Field>
      </FormSection>
    </FormDrawer>
  );
}
