"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface PublicGuestDetails {
  name: string;
  email: string;
  phone: string;
  notes: string;
  guestCount: string;
}

/**
 * Screen 3: who is coming.
 *
 * Deliberately short. Passport numbers and document uploads are not asked for
 * here: they belong to pre-check-in, where the property has a reason to collect
 * them, and asking at the point of enquiry loses bookings for nothing.
 *
 * A contact is required by the server, and the form asks for whichever the guest
 * prefers rather than forcing both.
 */
export function PublicGuestDetailsForm({
  details,
  onChange,
  onBack,
  onContinue,
  error,
}: {
  details: PublicGuestDetails;
  onChange: (field: keyof PublicGuestDetails, value: string) => void;
  onBack: () => void;
  onContinue: () => void;
  error: string | null;
}) {
  const hasContact = Boolean(details.email.trim() || details.phone.trim());
  const guestCountValid =
    !details.guestCount ||
    (Number(details.guestCount) >= 1 && Number(details.guestCount) <= 50);
  const canContinue =
    details.name.trim().length >= 2 && hasContact && guestCountValid;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canContinue) onContinue();
      }}
    >
      <div>
        <h3 className="font-serif text-2xl text-[var(--vms-ink)]">
          Who should we contact?
        </h3>
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
          Share the lead guest&apos;s name and one way to reach you. Party size
          is optional.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          required
          value={details.name}
          onChange={(event) => onChange("name", event.currentTarget.value)}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={details.email}
          onChange={(event) => onChange("email", event.currentTarget.value)}
        />
        <Input
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={details.phone}
          onChange={(event) => onChange("phone", event.currentTarget.value)}
        />
        <Input
          label="Number of guests (optional)"
          name="guest_count"
          type="number"
          min={1}
          max={50}
          value={details.guestCount}
          onChange={(event) =>
            onChange("guestCount", event.currentTarget.value)
          }
        />
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-[var(--vms-ink)]">
        Anything we should know?
        <textarea
          name="notes"
          rows={3}
          value={details.notes}
          onChange={(event) => onChange("notes", event.currentTarget.value)}
          placeholder="Late arrival, accessibility needs, special requests"
          className="rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
        />
      </label>

      <p className="text-xs text-[var(--vms-ink-muted)]">
        {hasContact
          ? "We will use this to confirm your booking."
          : "An email address or a phone number is needed so the property can reach you."}
      </p>

      {error ? (
        <p
          role="alert"
          className="text-xs font-medium text-[var(--vms-danger)]"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </form>
  );
}
