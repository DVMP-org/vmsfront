"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Home, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { formatMoney } from "@/lib/currency";
import { formatDateRange } from "@/lib/datetime";
import { canReserve } from "../public-api-types";
import type { PublicSiteBooking } from "../public-api-types";
import { PublicBookingPayment } from "./PublicBookingPayment";
import {
  usePublicSiteBooking,
  useSubmitPublicBooking,
} from "../public-queries";

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
 * The booking form a visitor sees on an organization's subdomain.
 *
 * It is shaped by the Site's own catalogue rather than by the domain name in the
 * URL: residential asks for a unit *and* the resident being visited, hospitality
 * may take a reservation with no room at all, and anything else asks only for
 * what it says it requires. The server refuses the rest, so the form cannot offer
 * something that would be rejected.
 *
 * Nothing here confirms a booking. The visitor is told plainly that a request was
 * made, because the decision belongs to a person at the Site.
 */
export function PublicBookingForm({ siteSlug }: { siteSlug: string }) {
  const catalogue = usePublicSiteBooking(siteSlug);
  const submit = useSubmitPublicBooking(siteSlug);

  const defaults = useMemo(defaultWindow, []);
  const [placeId, setPlaceId] = useState("");
  const [hostId, setHostId] = useState("");
  const [reserving, setReserving] = useState(false);
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [guestCount, setGuestCount] = useState("1");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");

  if (catalogue.isPending) {
    return (
      <PanelState
        kind="loading"
        title="Loading this Site's booking form"
        description="One moment."
      />
    );
  }

  if (catalogue.isError || !catalogue.data) {
    return (
      <PanelState
        kind="error"
        title="This booking form is unavailable"
        description="The link may have expired, or the Site may no longer be taking requests."
        onRetry={() => void catalogue.refetch()}
        isRetrying={catalogue.isFetching}
        retryLabel="Try again"
      />
    );
  }

  const site: PublicSiteBooking = catalogue.data;
  const reservingAllowed = canReserve(site);

  if (submit.isSuccess) {
    const created = submit.data;
    return (
      <section className="mx-auto flex max-w-xl flex-col items-start gap-3 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface)] p-6">
        <span className="flex items-center gap-2 text-[var(--vms-success)]">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-base font-semibold">Request sent</h1>
        </span>
        <p className="text-sm text-[var(--vms-ink)]">
          {created.site_name} has your request
          {created.place_name ? ` for ${created.place_name}` : ""}. Nothing is
          confirmed yet — you will hear back once someone has reviewed it.
        </p>
        <p className="text-xs text-[var(--vms-ink-muted)]">
          {formatDateRange(created.check_in_at, created.check_out_at)} ·{" "}
          {created.guest_count} {created.guest_count === 1 ? "guest" : "guests"}
        </p>
        <PublicBookingPayment siteSlug={siteSlug} booking={created} />
      </section>
    );
  }

  const hostsForPlace = placeId
    ? site.hosts.filter((host) => host.place_id === placeId)
    : site.hosts;
  const placeMissing = site.requires_place && !placeId;
  const hostMissing = site.requires_host && !hostId;
  const contactMissing = !email.trim() && !phone.trim();
  const canSubmit =
    !placeMissing && !hostMissing && !contactMissing && name.trim().length >= 2;

  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-4 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface)] p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        submit.mutate({
          kind: reserving && reservingAllowed ? "reservation" : "booking",
          place_id: placeId || null,
          host_party_id: hostId || null,
          check_in_at: new Date(checkIn).toISOString(),
          check_out_at: new Date(checkOut).toISOString(),
          guest_count: Math.max(1, Number(guestCount) || 1),
          requester_name: name.trim(),
          requester_email: email.trim() || null,
          requester_phone: phone.trim() || null,
          purpose: purpose.trim() || null,
        });
      }}
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-[var(--vms-ink)]">
          Book a visit to {site.site_name}
        </h1>
        <p className="text-xs text-[var(--vms-ink-muted)]">
          {site.requires_host
            ? "Choose the home you are visiting and the resident hosting you."
            : "Tell us when you would like to come."}
        </p>
      </header>

      {site.requires_place ? (
        <Field id="book-place" label="Where are you going?" required>
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
              <option value="">Choose a place…</option>
              {site.places.map((place) => (
                <option key={place.id} value={place.id}>
                  {/* A guest choosing a room should see what it costs before
                      picking, not after submitting. */}
                  {place.nightly_rate && place.currency
                    ? `${place.name} — ${formatMoney(place.nightly_rate, place.currency)} a night`
                    : place.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      ) : null}

      {site.requires_host ? (
        <Field
          id="book-host"
          label="Who is hosting you?"
          description={
            placeId && hostsForPlace.length === 0
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
              <option value="">Choose a resident…</option>
              {hostsForPlace.map((host) => (
                <option key={host.id} value={host.id}>
                  {host.display_name}
                </option>
              ))}
            </select>
          )}
        </Field>
      ) : null}

      {reservingAllowed ? (
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--vms-border)] px-3">
          <input
            type="checkbox"
            checked={reserving}
            onChange={(event) => setReserving(event.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-[var(--vms-ink)]">
            Hold a place for me — I have not chosen a room yet
          </span>
        </label>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="book-check-in" label="Arriving" required>
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
        <Field id="book-check-out" label="Leaving" required>
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

      <Field id="book-guests" label="How many of you?" required>
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

      <Field id="book-name" label="Your name" required>
        {(control) => (
          <input
            {...control}
            className={fieldControlClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        )}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="book-email"
          label="Email"
          description="Either this or a phone number."
        >
          {(control) => (
            <input
              {...control}
              type="email"
              className={fieldControlClassName}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          )}
        </Field>
        <Field id="book-phone" label="Phone">
          {(control) => (
            <input
              {...control}
              type="tel"
              className={fieldControlClassName}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
            />
          )}
        </Field>
      </div>

      {contactMissing ? (
        <p role="status" className="text-xs text-[var(--vms-ink-muted)]">
          Leave an email address or a phone number so the Site can reach you.
        </p>
      ) : null}

      <Field id="book-purpose" label="Purpose of your visit" description="Optional.">
        {(control) => (
          <input
            {...control}
            className={fieldControlClassName}
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
          />
        )}
      </Field>

      {submit.isError ? (
        <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
          {submit.error instanceof Error
            ? submit.error.message
            : "The request did not go through. Please try again."}
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit} isLoading={submit.isPending}>
        <CalendarClock className="h-4 w-4" aria-hidden="true" />
        Send request
      </Button>

      <p className="flex items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
        <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
        <Home className="h-3.5 w-3.5" aria-hidden="true" />
        Sending a request does not confirm your booking.
      </p>
    </form>
  );
}
