"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import { LabelledSwitch } from "@/components/ui/LabelledSwitch";
import { parseApiError } from "@/lib/error-utils";

import type {
  ChargeRecurrence,
  Lease,
  LeaseChargeLineInput,
  LeaseInput,
  LeaseKind,
} from "../api";
import { useCreateLease, useUpdateLease } from "../queries";

export type PlaceOption = { id: string; name: string; kind: string };
export type PartyOption = { id: string; display_name: string };

type ExtraLine = {
  key: string;
  name: string;
  amount: string;
  recurrence: ChargeRecurrence;
  create_definition: boolean;
};

type Draft = {
  place_id: string;
  party_id: string;
  kind: LeaseKind;
  reference: string;
  starts_at: string;
  ends_at: string;
  rent_amount: string;
  rent_cadence: ChargeRecurrence;
  rent_creates_definition: boolean;
  deposit_amount: string;
  notice_days: string;
  notes: string;
  extras: ExtraLine[];
};

const cadenceOptions: { value: ChargeRecurrence; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "biannual", label: "Every 6 months" },
  { value: "yearly", label: "Yearly" },
  { value: "one_time", label: "One-off" },
];

const kindOptions: { value: LeaseKind; label: string }[] = [
  { value: "lease", label: "Lease" },
  { value: "tenancy", label: "Tenancy" },
  { value: "licence", label: "Licence" },
  { value: "stay", label: "Stay" },
];

function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function addYears(value: string, years: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

function newLine(): ExtraLine {
  return {
    key: crypto.randomUUID(),
    name: "",
    amount: "",
    recurrence: "monthly",
    create_definition: false,
  };
}

function emptyDraft(): Draft {
  const starts = today();
  return {
    place_id: "",
    party_id: "",
    kind: "lease",
    reference: "",
    starts_at: starts,
    ends_at: addYears(starts, 1),
    rent_amount: "",
    rent_cadence: "monthly",
    rent_creates_definition: false,
    deposit_amount: "",
    notice_days: "30",
    notes: "",
    extras: [],
  };
}

function draftFrom(lease: Lease): Draft {
  const rent = lease.charge_lines.find(
    (line) => line.status !== "cancelled" && line.name === "Rent",
  );
  return {
    place_id: lease.place_id,
    party_id: lease.party_id,
    kind: lease.kind,
    reference: lease.reference ?? "",
    starts_at: lease.starts_at.slice(0, 10),
    ends_at: lease.ends_at ? lease.ends_at.slice(0, 10) : "",
    rent_amount: lease.rent_amount ?? rent?.amount ?? "",
    rent_cadence: (lease.rent_cadence ?? rent?.recurrence ?? "monthly") as ChargeRecurrence,
    rent_creates_definition: rent?.create_definition ?? false,
    deposit_amount: lease.deposit_amount ?? "",
    notice_days: String(lease.notice_days),
    notes: lease.notes ?? "",
    extras: lease.charge_lines
      .filter((line) => line.status !== "cancelled" && line.name !== "Rent")
      .map((line) => ({
        key: line.id,
        name: line.name,
        amount: line.amount,
        recurrence: line.recurrence,
        create_definition: line.create_definition,
      })),
  };
}

/**
 * Draft a lease: the agreement, its term and the charges it will bill.
 *
 * The rent field mirrors into the "Rent" charge line, so the headline rent and
 * what the tenant is actually billed can never drift apart. Additional charges
 * are listed explicitly because each one needs its own answer to "reuse the Site
 * definition or create a new one?".
 */
export function LeaseFormDrawer({
  isOpen,
  onClose,
  siteId,
  lease,
  places,
  parties,
}: {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string | null;
  lease?: Lease | null;
  places: PlaceOption[];
  parties: PartyOption[];
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showErrors, setShowErrors] = useState(false);
  const create = useCreateLease(siteId);
  const update = useUpdateLease(siteId);
  const mutation = lease ? update : create;
  const editing = Boolean(lease);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(lease ? draftFrom(lease) : emptyDraft());
    setShowErrors(false);
    create.reset();
    update.reset();
    // Reset only when the drawer opens or the target lease changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lease?.id]);

  function update$<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const errors = useMemo(() => {
    const found: Record<string, string> = {};
    if (!draft.place_id) found.place_id = "Choose the space this lease covers";
    if (!draft.party_id) found.party_id = "Choose the party taking the space";
    if (!draft.starts_at) found.starts_at = "Choose a start date";
    if (draft.ends_at && draft.ends_at <= draft.starts_at) {
      found.ends_at = "The end date must be after the start date";
    }
    if (!draft.ends_at && draft.kind === "stay") {
      found.ends_at = "A stay must have an end date";
    }
    draft.extras.forEach((line) => {
      if (!line.name.trim()) {
        found[`extra-${line.key}`] = "Name this charge";
      } else if (!(Number(line.amount) > 0)) {
        found[`extra-${line.key}`] = "Enter an amount greater than zero";
      }
    });
    return found;
  }, [draft]);

  const chargeLines = useMemo<LeaseChargeLineInput[]>(() => {
    const lines: LeaseChargeLineInput[] = [];
    if (Number(draft.rent_amount) > 0) {
      lines.push({
        name: "Rent",
        amount: draft.rent_amount,
        recurrence: draft.rent_cadence,
        create_definition: draft.rent_creates_definition,
      });
    }
    for (const line of draft.extras) {
      if (!line.name.trim() || !(Number(line.amount) > 0)) continue;
      lines.push({
        name: line.name.trim(),
        amount: line.amount,
        recurrence: line.recurrence,
        create_definition: line.create_definition,
      });
    }
    return lines;
  }, [draft]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    if (Object.keys(errors).length > 0) return;

    const input: LeaseInput = {
      place_id: draft.place_id,
      party_id: draft.party_id,
      kind: draft.kind,
      reference: draft.reference || null,
      starts_at: draft.starts_at,
      ends_at: draft.ends_at || null,
      rent_amount: Number(draft.rent_amount) > 0 ? draft.rent_amount : null,
      currency: "NGN",
      rent_cadence: Number(draft.rent_amount) > 0 ? draft.rent_cadence : null,
      deposit_amount:
        Number(draft.deposit_amount) > 0 ? draft.deposit_amount : null,
      notice_days: Number(draft.notice_days) || 0,
      notes: draft.notes || null,
      charge_lines: chargeLines,
    };

    if (lease) {
      update.mutate(
        { id: lease.id, ...input },
        { onSuccess: () => onClose() },
      );
    } else {
      create.mutate(input, { onSuccess: () => onClose() });
    }
  }

  const failure = mutation.isError
    ? parseApiError(mutation.error).message
    : null;
  const visible = (key: string) => (showErrors ? errors[key] : undefined);

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Edit draft lease" : "Draft a lease"}
      description="A draft holds a plan only. Charges are created when you confirm it."
      submitLabel="Save draft"
      isSubmitting={mutation.isPending}
      onSubmit={submit}
      error={failure}
      size="lg"
      footerNote={
        chargeLines.length === 0
          ? "This draft has no charges planned, so confirming it would bill nothing."
          : `${chargeLines.length} charge${chargeLines.length === 1 ? "" : "s"} planned`
      }
    >
      <FormSection
        title="Agreement"
        description="Who takes which space, and under what kind of agreement."
      >
        <Field
          id="lease-place"
          label="Space"
          required
          error={visible("place_id")}
        >
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={draft.place_id}
              onChange={(event) => update$("place_id", event.target.value)}
            >
              <option value="">Select a space</option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name} — {place.kind}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field id="lease-party" label="Party" required error={visible("party_id")}>
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={draft.party_id}
              onChange={(event) => update$("party_id", event.target.value)}
            >
              <option value="">Select a party</option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.display_name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="lease-kind" label="Agreement type">
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={draft.kind}
                onChange={(event) =>
                  update$("kind", event.target.value as LeaseKind)
                }
              >
                {kindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="lease-reference"
            label="Reference"
            description="Optional, for the signed document."
          >
            {(control) => (
              <input
                {...control}
                className={fieldControlClassName}
                value={draft.reference}
                onChange={(event) => update$("reference", event.target.value)}
                placeholder="e.g. LSE-2026-014"
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Term"
        description="Leave the end date empty for a periodic tenancy that runs on."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="lease-starts"
            label="Starts"
            required
            error={visible("starts_at")}
          >
            {(control) => (
              <input
                {...control}
                type="date"
                className={fieldControlClassName}
                value={draft.starts_at}
                onChange={(event) => update$("starts_at", event.target.value)}
              />
            )}
          </Field>
          <Field id="lease-ends" label="Ends" error={visible("ends_at")}>
            {(control) => (
              <input
                {...control}
                type="date"
                className={fieldControlClassName}
                value={draft.ends_at}
                onChange={(event) => update$("ends_at", event.target.value)}
              />
            )}
          </Field>
        </div>
        <Field
          id="lease-notice"
          label="Notice period (days)"
          description="Used when the term is renewed or ended early."
        >
          {(control) => (
            <input
              {...control}
              type="number"
              min={0}
              max={365}
              className={fieldControlClassName}
              value={draft.notice_days}
              onChange={(event) => update$("notice_days", event.target.value)}
            />
          )}
        </Field>
      </FormSection>

      <FormSection
        title="Rent"
        description="The headline rent becomes the first charge line, so the two cannot disagree."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="lease-rent" label="Amount">
            {(control) => (
              <input
                {...control}
                type="number"
                min={0}
                step="0.01"
                className={fieldControlClassName}
                value={draft.rent_amount}
                onChange={(event) =>
                  update$("rent_amount", event.target.value)
                }
                placeholder="500000"
              />
            )}
          </Field>
          <Field id="lease-rent-cadence" label="Billed">
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={draft.rent_cadence}
                onChange={(event) =>
                  update$(
                    "rent_cadence",
                    event.target.value as ChargeRecurrence,
                  )
                }
              >
                {cadenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <LabelledSwitch
          id="lease-rent-creates-definition"
          checked={draft.rent_creates_definition}
          onChange={(next) => update$("rent_creates_definition", next)}
          label="Create a new Rent charge definition"
          description="Off reuses the Site's existing Rent definition, which must match this amount and cadence exactly. On creates a separate one, useful when this tenant's rent differs from everyone else's."
        />
        <Field
          id="lease-deposit"
          label="Deposit"
          description="Recorded on the agreement; bill it as a one-off charge in additional charges."
        >
          {(control) => (
            <input
              {...control}
              type="number"
              min={0}
              step="0.01"
              className={fieldControlClassName}
              value={draft.deposit_amount}
              onChange={(event) =>
                update$("deposit_amount", event.target.value)
              }
              placeholder="0"
            />
          )}
        </Field>
      </FormSection>

      <FormSection
        title="Additional charges"
        description="Service charge, parking, utilities. Each line is billed for this lease term only."
      >
        <div className="space-y-3">
          {draft.extras.length === 0 ? (
            <p className="text-sm text-[var(--vms-ink-muted)]">
              No additional charges.
            </p>
          ) : null}
          {draft.extras.map((line, index) => (
            <div
              key={line.key}
              className="space-y-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-border)] p-3"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  id={`lease-extra-name-${line.key}`}
                  label="Charge"
                  error={visible(`extra-${line.key}`)}
                >
                  {(control) => (
                    <input
                      {...control}
                      className={fieldControlClassName}
                      value={line.name}
                      onChange={(event) => {
                        const next = [...draft.extras];
                        next[index] = { ...line, name: event.target.value };
                        update$("extras", next);
                      }}
                      placeholder="Service charge"
                    />
                  )}
                </Field>
                <Field id={`lease-extra-amount-${line.key}`} label="Amount">
                  {(control) => (
                    <input
                      {...control}
                      type="number"
                      min={0}
                      step="0.01"
                      className={fieldControlClassName}
                      value={line.amount}
                      onChange={(event) => {
                        const next = [...draft.extras];
                        next[index] = { ...line, amount: event.target.value };
                        update$("extras", next);
                      }}
                    />
                  )}
                </Field>
                <Field id={`lease-extra-cadence-${line.key}`} label="Billed">
                  {(control) => (
                    <select
                      {...control}
                      className={fieldControlClassName}
                      value={line.recurrence}
                      onChange={(event) => {
                        const next = [...draft.extras];
                        next[index] = {
                          ...line,
                          recurrence: event.target.value as ChargeRecurrence,
                        };
                        update$("extras", next);
                      }}
                    >
                      {cadenceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
              <div className="flex items-start justify-between gap-3">
                <LabelledSwitch
                  id={`lease-extra-new-definition-${line.key}`}
                  className="flex-1"
                  checked={line.create_definition}
                  onChange={(next) => {
                    const updated = [...draft.extras];
                    updated[index] = { ...line, create_definition: next };
                    update$("extras", updated);
                  }}
                  label={
                    line.name
                      ? `Create a new definition for ${line.name}`
                      : "Create a new charge definition"
                  }
                  description={
                    line.name
                      ? `Off reuses the Site's existing ${line.name} definition, which must match this amount and cadence.`
                      : "Off reuses the Site definition with the same name once you name this charge."
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    update$(
                      "extras",
                      draft.extras.filter((entry) => entry.key !== line.key),
                    )
                  }
                  aria-label={`Remove ${line.name || "charge"}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update$("extras", [...draft.extras, newLine()])}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add a charge
          </Button>
        </div>
      </FormSection>

      <FormSection title="Notes">
        <Field id="lease-notes" label="Internal notes">
          {(control) => (
            <textarea
              {...control}
              className={fieldControlClassName}
              rows={3}
              value={draft.notes}
              onChange={(event) => update$("notes", event.target.value)}
            />
          )}
        </Field>
      </FormSection>
    </FormDrawer>
  );
}
