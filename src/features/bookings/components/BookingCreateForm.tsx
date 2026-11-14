"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { placeRelationshipsApi, placesApi } from "@/features/places/api";
import type { Place } from "@/features/places/api";
import { useCreateBooking } from "../queries";
import type { AdminBookingCreateInput } from "../api-types";

/** Which Place kinds a Site domain may book. The server holds the same rule. */
const KINDS_BY_DOMAIN: Record<string, string[]> = {
  residential: ["unit"],
  hospitality: ["room"],
  commercial: ["unit", "space"],
  mixed_use: ["unit", "room", "space"],
};

const HOST_ROLES = ["resident", "owner", "tenant", "household_member"];

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function defaultWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  end.setHours(10, 0, 0, 0);
  return { checkIn: toLocalInput(start), checkOut: toLocalInput(end) };
}

/**
 * Taking a booking for a caller or someone at the desk.
 *
 * The Site's domain decides what this form asks for, and the server decides
 * whether it is allowed at all — a commercial Site is refused, and the form says
 * so rather than offering fields that would fail.
 */
export function BookingCreateForm({ onCreated }: { onCreated: () => void }) {
  const context = useWorkspaceContext();
  const domain = context.data?.effective_use_case ?? null;
  const allowedKinds = domain ? (KINDS_BY_DOMAIN[domain] ?? []) : [];
  const reservable = domain === "hospitality";
  const needsHost = domain === "residential";

  const defaults = defaultWindow();
  const [source, setSource] =
    useState<AdminBookingCreateInput["source"]>("phone");
  const [kind, setKind] = useState<AdminBookingCreateInput["kind"]>("booking");
  const [placeId, setPlaceId] = useState("");
  const [hostId, setHostId] = useState("");
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [guestCount, setGuestCount] = useState("1");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const create = useCreateBooking();

  const places = useQuery({
    queryKey: ["places", "bookable", domain],
    queryFn: () =>
      placesApi.list({ page: 1, page_size: 100, is_active: true }),
    enabled: Boolean(domain),
  });
  const bookable = (places.data?.items ?? []).filter((place: Place) =>
    allowedKinds.includes(place.kind),
  );

  const relationships = useQuery({
    queryKey: ["place-relationships", placeId],
    queryFn: () =>
      placeRelationshipsApi.list({ place_id: placeId, status: "active" }),
    enabled: needsHost && Boolean(placeId),
  });
  const hosts = (relationships.data?.items ?? []).filter((item) =>
    HOST_ROLES.includes(item.role),
  );

  if (context.isPending) {
    return <p className="text-sm text-[var(--vms-ink-muted)]">Loading this Site…</p>;
  }

  if (!domain || allowedKinds.length === 0) {
    return (
      <p className="rounded-lg border border-[var(--vms-border)] px-3 py-2 text-sm text-[var(--vms-ink-muted)]">
        Bookings cannot be taken for this Site yet — its workflow is not
        specified.
      </p>
    );
  }

  const reserving = reservable && kind === "reservation";
  const placeMissing = !reserving && !placeId;
  const hostMissing = needsHost && !hostId;
  const canSubmit =
    !placeMissing &&
    !hostMissing &&
    name.trim().length >= 2 &&
    new Date(checkOut) > new Date(checkIn);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        create.mutate(
          {
            kind: reserving ? "reservation" : "booking",
            source,
            place_id: reserving ? null : placeId,
            host_party_id: needsHost ? hostId : null,
            check_in_at: new Date(checkIn).toISOString(),
            check_out_at: new Date(checkOut).toISOString(),
            guest_count: Math.max(1, Number(guestCount) || 1),
            requester_name: name.trim(),
            requester_email: email.trim() || null,
            requester_phone: phone.trim() || null,
            purpose: purpose.trim() || null,
          },
          { onSuccess: onCreated },
        );
      }}
    >
      <Field id="booking-source" label="How did they reach us?" required>
        {(control) => (
          <select
            {...control}
            className={fieldControlClassName}
            value={source}
            onChange={(event) =>
              setSource(event.target.value as AdminBookingCreateInput["source"])
            }
          >
            <option value="phone">Phone call</option>
            <option value="walk_in">Walk-in</option>
            <option value="staff">Other staff</option>
          </select>
        )}
      </Field>

      {reservable ? (
        <Field
          id="booking-kind"
          label="Hold or room?"
          description="A reservation holds nothing until a room is assigned."
        >
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as AdminBookingCreateInput["kind"])
              }
            >
              <option value="booking">A named room</option>
              <option value="reservation">A reservation, no room yet</option>
            </select>
          )}
        </Field>
      ) : null}

      {reserving ? null : (
        <Field
          id="booking-place"
          label={domain === "hospitality" ? "Room" : "Place"}
          required
        >
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={placeId}
              onChange={(event) => {
                setPlaceId(event.target.value);
                setHostId("");
              }}
            >
              <option value="">Choose…</option>
              {bookable.map((place: Place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}

      {needsHost ? (
        <Field
          id="booking-host"
          label="Resident being visited"
          description={
            placeId && hosts.length === 0
              ? "Nobody is registered at that place."
              : undefined
          }
          required
        >
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={hostId}
              onChange={(event) => setHostId(event.target.value)}
            >
              <option value="">Choose…</option>
              {hosts.map((item) => (
                <option key={item.id} value={item.party.id}>
                  {item.party.display_name}
                </option>
              ))}
            </select>
          )}
        </Field>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="booking-check-in" label="Arriving" required>
          {(control) => (
            <input
              {...control}
              type="datetime-local"
              className={fieldControlClassName}
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
            />
          )}
        </Field>
        <Field id="booking-check-out" label="Leaving" required>
          {(control) => (
            <input
              {...control}
              type="datetime-local"
              className={fieldControlClassName}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
            />
          )}
        </Field>
      </div>

      <Field id="booking-guests" label="Guests" required>
        {(control) => (
          <input
            {...control}
            type="number"
            min={1}
            max={50}
            className={fieldControlClassName}
            value={guestCount}
            onChange={(event) => setGuestCount(event.target.value)}
          />
        )}
      </Field>

      <Field id="booking-name" label="Who is it for?" required>
        {(control) => (
          <input
            {...control}
            className={fieldControlClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="booking-email" label="Email">
          {(control) => (
            <input
              {...control}
              type="email"
              className={fieldControlClassName}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </Field>
        <Field id="booking-phone" label="Phone">
          {(control) => (
            <input
              {...control}
              type="tel"
              className={fieldControlClassName}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          )}
        </Field>
      </div>

      <Field id="booking-purpose" label="Purpose" description="Optional.">
        {(control) => (
          <input
            {...control}
            className={fieldControlClassName}
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
          />
        )}
      </Field>

      {create.isError ? (
        <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
          {create.error instanceof Error
            ? create.error.message
            : "The booking did not go through."}
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit} isLoading={create.isPending}>
        Take booking
      </Button>
      <p className="text-xs text-[var(--vms-ink-muted)]">
        It arrives as a request, so it still needs a decision.
      </p>
    </form>
  );
}
