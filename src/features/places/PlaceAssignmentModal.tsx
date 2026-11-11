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
import { placeRelationshipsApi } from "./api";
const occupancyRoles = ["resident", "owner", "tenant", "household_member"];
const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function PlaceAssignmentModal({
  open,
  title = "Assign resident",
  placeLabel = "Place",
  defaultPlaceId,
  siteId,
  places,
  contextKey,
  onClose,
  onSaved,
}: {
  open: boolean;
  title?: string;
  placeLabel?: string;
  defaultPlaceId?: string;
  siteId: string;
  places: Array<{ id: string; name: string }>;
  contextKey: QueryContext;
  onClose: () => void;
  onSaved: () => void;
}) {
  const client = useQueryClient();
  const [placeId, setPlaceId] = useState(defaultPlaceId || places[0]?.id || "");
  const [personMode, setPersonMode] = useState<"existing" | "new">("existing");
  const [party, setParty] = useState<FacetItem | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("resident");
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
      return placeRelationshipsApi.create({
        party_id: party!.value,
        place_id: placeId,
        role,
        status: "active",
        ...effective,
      });
    },
    onSuccess: () => {
      toast.success("Household relationship created.");
      for (const queryKey of [
        ["auth", "verify"], queryKeys.relationships.all,
        queryKeys.people.all, queryKeys.places.all, ["place"], ["residential"],
      ]) void client.invalidateQueries({ queryKey });
      onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!placeId) next["household-unit"] = "Choose a unit.";
    if (personMode === "existing" && !party) {
      next.party = "Choose the person joining this unit.";
    }
    if (personMode === "new" && !displayName.trim()) {
      next["resident-name"] = "Enter the resident's full name.";
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
      title={title}
      description="Assign an existing person or add a new resident to this place."
      size="md"
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {!places.length ? (
          <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 text-sm">
            <p className="font-semibold">Choose a place first.</p>
            <p className="mt-1 text-[var(--vms-ink-muted)]">
              Select a place before assigning a resident.
            </p>
            <Button asChild variant="outline" className="mt-3">
              <Link href="/admin/places">Open places</Link>
            </Button>
          </div>
        ) : null}
        <FormErrorSummary errors={errors} />
        <Field
          id="household-unit"
          label={placeLabel}
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
              {places.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <fieldset>
          <legend className="text-sm font-semibold">Resident</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["existing", "Existing Party"],
                ["new", "New resident"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 text-sm font-medium"
              >
                <input
                  type="radio"
                  name="resident-mode"
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
            kind="person"
            label="Person"
            value={party}
            onChange={setParty}
            contextKey={contextKey}
            error={errors.party}
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
              {occupancyRoles.map((option) => (
                <option key={option} value={option}>
                  {titleCase(option)}
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
            {save.isPending ? "Assigning…" : "Assign relationship"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
