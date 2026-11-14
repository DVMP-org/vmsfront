"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer } from "@/components/ui/form/FormDrawer";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { FormSection } from "@/components/ui/form/FormSection";
import { Switch } from "@/components/ui/Switch";
import { parseApiError } from "@/lib/error-utils";

import { useCreateContractor } from "../queries";

interface Draft {
  contact_name: string;
  email: string;
  company_name: string;
  phone: string;
  purpose: string;
  access_from: string;
  access_to: string;
  requires_permit: boolean;
  permit_reference: string;
  permit_expires_at: string;
  notes: string;
}

function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultDraft(): Draft {
  const start = new Date();
  start.setHours(8, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  end.setHours(18, 0, 0, 0);
  return {
    contact_name: "",
    email: "",
    company_name: "",
    phone: "",
    purpose: "",
    access_from: toLocalInput(start),
    access_to: toLocalInput(end),
    requires_permit: false,
    permit_reference: "",
    permit_expires_at: "",
    notes: "",
  };
}

/**
 * Contractors are Site records, not Party records: registering one invites an
 * external person or firm for a bounded window and, when required, records the
 * permit that lets them on Site.
 */
export function CreateContractorDrawer({
  isOpen,
  onClose,
  siteId,
}: {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string | null;
}) {
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useCreateContractor(siteId);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(defaultDraft());
    setErrors({});
    mutation.reset();
    // Reset only when the drawer opens; changing the draft must not reset it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function update<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (draft.contact_name.trim().length < 2) {
      next.contact_name = "Enter the contractor's name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      next.email = "Enter a valid email address.";
    }
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
        contact_name: draft.contact_name.trim(),
        email: draft.email.trim(),
        company_name: draft.company_name.trim() || null,
        phone: draft.phone.trim() || null,
        purpose: draft.purpose.trim() || null,
        requires_permit: draft.requires_permit,
        permit_reference: draft.requires_permit
          ? draft.permit_reference.trim()
          : null,
        permit_expires_at: draft.requires_permit && draft.permit_expires_at
          ? new Date(draft.permit_expires_at).toISOString()
          : null,
        access_from: new Date(draft.access_from).toISOString(),
        access_to: new Date(draft.access_to).toISOString(),
        notes: draft.notes.trim() || null,
      },
      { onSuccess: onClose },
    );
  }

  const serverError = mutation.error ? parseApiError(mutation.error).message : null;

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Register contractor"
      description="The contractor is registered for this Site and emailed their access window."
      onSubmit={submit}
      submitLabel="Register contractor"
      isSubmitting={mutation.isPending}
      canSubmit={Boolean(siteId)}
      error={serverError}
      footerNote="Contractors never appear in the tenant or employee directories."
    >
      <FormErrorSummary errors={errors} />

      <FormSection
        title="Contractor"
        description="The person or firm arriving on Site."
        icon={UserRoundPlus}
      >
        <Field id="contractor-name" label="Contact name" required error={errors.contact_name}>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={draft.contact_name}
              onChange={(event) => update("contact_name", event.target.value)}
              placeholder="e.g. Ada Field"
              autoComplete="name"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contractor-email" label="Email" required error={errors.email}>
            {(control) => (
              <input
                {...control}
                type="email"
                inputMode="email"
                autoComplete="email"
                className={fieldControlClassName}
                value={draft.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="ada@vendor.example"
              />
            )}
          </Field>
          <Field id="contractor-phone" label="Phone">
            {(control) => (
              <input
                {...control}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={fieldControlClassName}
                value={draft.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contractor-company" label="Company">
            {(control) => (
              <input
                {...control}
                className={fieldControlClassName}
                value={draft.company_name}
                onChange={(event) => update("company_name", event.target.value)}
                placeholder="e.g. Field Facilities"
                autoComplete="organization"
              />
            )}
          </Field>
          <Field id="contractor-purpose" label="Purpose">
            {(control) => (
              <input
                {...control}
                className={fieldControlClassName}
                value={draft.purpose}
                onChange={(event) => update("purpose", event.target.value)}
                placeholder="e.g. HVAC service"
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Access window"
        description="Contractors are time-bounded by definition; the window is enforced at the gate."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contractor-access-from" label="Allowed from" required>
            {(control) => (
              <input
                {...control}
                type="datetime-local"
                className={fieldControlClassName}
                value={draft.access_from}
                onChange={(event) => update("access_from", event.target.value)}
              />
            )}
          </Field>
          <Field
            id="contractor-access-to"
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
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Permit"
        description="Switch this on when the Site requires a permit before entry."
        icon={ShieldCheck}
      >
        <Switch
          checked={draft.requires_permit}
          onChange={(next) => update("requires_permit", next)}
          label="Permit required"
          description="The invitation states the permit reference and expiry."
        />
        {draft.requires_permit ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="contractor-permit-reference"
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
                  placeholder="e.g. PRM-2043"
                />
              )}
            </Field>
            <Field
              id="contractor-permit-expiry"
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
                />
              )}
            </Field>
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Notes" description="Internal context for the site team.">
        <Field id="contractor-notes" label="Notes">
          {(control) => (
            <textarea
              {...control}
              className={`${fieldControlClassName} resize-none`}
              rows={3}
              value={draft.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Site induction completed, PPE provided…"
            />
          )}
        </Field>
      </FormSection>

      <div className="sm:hidden">
        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Register contractor
        </Button>
      </div>
    </FormDrawer>
  );
}
