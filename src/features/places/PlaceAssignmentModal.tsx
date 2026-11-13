"use client";

import { queryKeys, type QueryContext } from "@/lib/query-keys";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FacetPicker, type FacetItem } from "@/components/facets/FacetPicker";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Modal } from "@/components/ui/Modal";
import { parseApiError } from "@/lib/error-utils";
import { peopleApi } from "@/features/people/api";
import { partiesApi } from "@/features/parties/api";
import { placeRelationshipsApi } from "./api";
import {
  placeAssignmentCopyFor,
  placePartyKindFor,
  placeRolesFor,
  type PlaceAssignmentCopy,
  type PlaceRole,
} from "./roles";

export function PlaceAssignmentModal({
  open,
  useCase,
  copy,
  title,
  placeLabel,
  roles,
  partyKind,
  closedPlaceName,
  defaultPlaceId,
  siteId,
  places,
  contextKey,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Site use case: chooses the domain's roles, wording and party kinds. */
  useCase?: string | null;
  /** Explicit overrides on top of the use case defaults. */
  copy?: Partial<PlaceAssignmentCopy>;
  title?: string;
  placeLabel?: string;
  roles?: PlaceRole[];
  partyKind?: "person" | "any";
  /** Shown instead of a one-option select when the place is already fixed. */
  closedPlaceName?: string;
  defaultPlaceId?: string;
  siteId: string;
  places: Array<{ id: string; name: string }>;
  contextKey: QueryContext;
  onClose: () => void;
  onSaved: () => void;
}) {
  const client = useQueryClient();
  const resolvedPartyKind = partyKind ?? placePartyKindFor(useCase);
  const roleOptions = roles?.length ? roles : placeRolesFor(useCase);
  const labels = {
    ...placeAssignmentCopyFor(useCase),
    ...copy,
    ...(title ? { title } : {}),
    ...(placeLabel ? { placeLabel } : {}),
  } satisfies PlaceAssignmentCopy;
  const [placeId, setPlaceId] = useState(defaultPlaceId || places[0]?.id || "");
  const [personMode, setPersonMode] = useState<"existing" | "new">("existing");
  const [party, setParty] = useState<FacetItem | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(roleOptions[0]?.value ?? "resident");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: async () => {
      const effective = {
        effective_from: effectiveFrom
          ? new Date(`${effectiveFrom}T00:00:00`).toISOString()
          : null,
        effective_to: effectiveTo
          ? new Date(`${effectiveTo}T00:00:00`).toISOString()
          : null,
      };
      if (personMode === "new") {
        if (resolvedPartyKind === "person") {
          return peopleApi.add(siteId, {
            place_id: placeId,
            display_name: displayName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || undefined,
            kind: "person",
            role,
            ...effective,
          });
        }
        // A business tenant is a Party in its own right: create the Party, then
        // attach it, so the same record can hold charges, leases and contacts.
        const created = await partiesApi.create({
          kind: "organization",
          display_name: displayName.trim(),
          email: email.trim().toLowerCase() || null,
          phone: phone.trim() || null,
        });
        return placeRelationshipsApi.create({
          party_id: created.id,
          place_id: placeId,
          role,
          status: "active",
          ...effective,
        });
      }
      return placeRelationshipsApi.create({
        party_id: party!.value,
        place_id: placeId,
        role,
        status: "active",
        ...effective,
      });
    },
    onSuccess: () => {
      toast.success(
        resolvedPartyKind === "person"
          ? "Household relationship created."
          : "Party attached to the place.",
      );
      for (const queryKey of [
        ["auth", "verify"], queryKeys.relationships.all,
        queryKeys.people.all, queryKeys.places.all, ["place"], ["residential"],
        ["commercial"], ["hospitality"], ["mixed_use"],
      ]) void client.invalidateQueries({ queryKey });
      onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!placeId) next["household-unit"] = "Choose a place.";
    if (personMode === "existing" && !party) {
      next.party = `Choose the ${labels.partyLabel.toLowerCase()} joining this place.`;
    }
    if (personMode === "new" && !displayName.trim()) {
      next["resident-name"] =
        resolvedPartyKind === "person"
          ? "Enter the resident's full name."
          : "Enter the party's name.";
    }
    if (
      personMode === "new" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      next["resident-email"] = "Enter a valid email address.";
    }
    if (effectiveFrom && effectiveTo && effectiveTo <= effectiveFrom) {
      next.effective_to = "The end date must be after the start date.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={labels.title}
      description={labels.description}
      size="md"
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {!places.length ? (
          <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 text-sm">
            <p className="font-semibold">Choose a place first.</p>
            <p className="mt-1 text-[var(--vms-ink-muted)]">
              Select a place before adding a party.
            </p>
            <Button asChild variant="outline" className="mt-3">
              <Link href="/admin/places">Open places</Link>
            </Button>
          </div>
        ) : null}
        <FormErrorSummary errors={errors} />
        {closedPlaceName && places.length === 1 ? (
          <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
              {labels.placeLabel}
            </p>
            <p className="mt-0.5 text-sm font-medium">
              {closedPlaceName ?? places[0].name}
            </p>
          </div>
        ) : (
          <Field
            id="household-unit"
            label={labels.placeLabel}
            required
            error={errors["household-unit"]}
          >
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={placeId}
                onChange={(event) => setPlaceId(event.target.value)}
              >
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
        <fieldset>
          <legend className="text-sm font-semibold">{labels.partyLabel}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["existing", "Existing Party"],
                ["new", labels.newPartyLabel],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 text-sm font-medium"
              >
                <input
                  type="radio"
                  name="party-mode"
                  value={value}
                  checked={personMode === value}
                  onChange={() => {
                    setPersonMode(value);
                    setErrors({});
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {personMode === "existing" ? (
          <FacetPicker
            facet="parties"
            kind={resolvedPartyKind === "person" ? "person" : undefined}
            label={labels.partyLabel}
            value={party}
            onChange={setParty}
            contextKey={contextKey}
            error={errors.party}
            description={
              resolvedPartyKind === "any"
                ? "Search people and organizations. A business tenant is normally an organization."
                : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="resident-name"
              label="Full name"
              required
              error={errors["resident-name"]}
            >
              {(control) => (
                <input
                  {...control}
                  className={fieldControlClassName}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                />
              )}
            </Field>
            <Field
              id="resident-email"
              label="Email address"
              required
              error={errors["resident-email"]}
            >
              {(control) => (
                <input
                  {...control}
                  type="email"
                  inputMode="email"
                  className={fieldControlClassName}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              )}
            </Field>
            <Field id="resident-phone" label="Phone number">
              {(control) => (
                <input
                  {...control}
                  type="tel"
                  inputMode="tel"
                  className={fieldControlClassName}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                />
              )}
            </Field>
          </div>
        )}
        <Field id="household-role" label="Relationship" required>
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="effective-from" label="Starts">
            {(control) => (
              <input
                {...control}
                type="date"
                className={fieldControlClassName}
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            )}
          </Field>
          <Field
            id="effective-to"
            label="Lease / occupancy ends"
            error={errors.effective_to}
            description="Required for fixed-term leases; leave blank for open-ended occupancy."
          >
            {(control) => (
              <input
                {...control}
                type="date"
                className={fieldControlClassName}
                value={effectiveTo}
                onChange={(event) => setEffectiveTo(event.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : labels.action}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
