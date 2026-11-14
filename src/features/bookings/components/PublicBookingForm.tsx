"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Home, Info } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { parseApiError } from "@/lib/error-utils";
import { formatDateRange } from "@/lib/datetime";
import { canReserve } from "../public-api-types";
import type { PublicSiteBooking } from "../public-api-types";
import { PublicBookingPayment } from "./PublicBookingPayment";
import {
  defaultStayDates,
  nightsBetween,
  placeLabel,
  stayWindow,
} from "../public-lib";
import {
  usePublicSiteBooking,
  useSubmitPublicBooking,
} from "../public-queries";

/**
 * The booking form a visitor sees on an organization's subdomain.
 *
 * One screen, because there are only three questions: which place, which person,
 * and when. It is not a sales funnel — nothing here is inventory, nothing is
 * priced, and no availability is being promised. A visitor is asking someone who
 * lives or works at the place whether they may come, so the form gets out of the
 * way and leaves the decision to that person.
 *
 * It is shaped by the Site's own catalogue rather than by the domain name in the
 * URL: residential and commercial ask for a unit *and* the party with standing at
 * it, hospitality without room types may take a reservation with no room at all,
 * and anything else asks only for what it says it requires. The server refuses the
 * rest, so the form never offers something that would be rejected.
 *
 * Nothing here confirms a booking. The visitor is told plainly that a request was
 * made, because the decision belongs to a person at the Site.
 */
export function PublicBookingForm({
  siteSlug,
  catalogue: provided,
}: {
  siteSlug: string;
  /** The entry point already read this; passing it avoids a second request. */
  catalogue?: PublicSiteBooking;
}) {
  const query = usePublicSiteBooking(siteSlug);
  const catalogue = provided
    ? {
        data: provided,
        isPending: false,
        isError: false,
        isFetching: false,
        refetch: query.refetch,
      }
    : query;
  const submit = useSubmitPublicBooking(siteSlug);

  const defaults = useMemo(defaultStayDates, []);
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
  // Who is hosting is meaningless before the visitor has said where they are
  // going, and offering the whole Site's people would be a list they cannot judge.
  const askForHost = site.requires_host && (placeId !== "" || !site.requires_place);
  const nights = nightsBetween(checkIn, checkOut);
  const window = stayWindow(checkIn, checkOut);
  const placeMissing = site.requires_place && !placeId;
  const hostMissing = site.requires_host && !hostId;
  const datesMissing = window.checkInAt === null || window.checkOutAt === null;
  const contactMissing = !email.trim() && !phone.trim();
  const canSubmit =
    !placeMissing &&
    !hostMissing &&
    !datesMissing &&
    !contactMissing &&
    name.trim().length >= 2;

  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-5 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface)] p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit || !window.checkInAt || !window.checkOutAt) return;
        submit.mutate({
          kind: reserving && reservingAllowed ? "reservation" : "booking",
          place_id: placeId || null,
          host_party_id: hostId || null,
          check_in_at: window.checkInAt,
          check_out_at: window.checkOutAt,
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
          Request a visit to {site.site_name}
        </h1>
        <p className="text-xs text-[var(--vms-ink-muted)]">
          {site.requires_host
            ? "Tell the person hosting you where and when. They decide."
            : "Tell us when you would like to come."}
        </p>
      </header>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
          Where and who
        </legend>

        {site.requires_place ? (
          <Field
            id="book-place"
            label="Where are you going?"
            description={
              site.places.length > 0
                ? undefined
                : "This Site has not published any places to request yet."
            }
            required
          >
            {(control) => (
              <SearchableSelect
                {...control}
                // react-select puts a plain `id` on its wrapper div, which would
                // leave the Field's label pointing at a non-labellable element.
                // The input is the control, so the label has to reach that.
                id={undefined}
                inputId={control.id}
                options={site.places.map((place) => ({
                  value: place.id,
                  label: placeLabel(place),
                }))}
                value={placeId}
                onChange={(chosen) => {
                  setPlaceId(chosen ?? "");
                  // A different place means a different person, so the previous
                  // choice cannot stand. Where only one person answers for this
                  // one, asking again would be busywork.
                  const hostsHere = site.hosts.filter(
                    (host) => host.place_id === (chosen ?? ""),
                  );
                  setHostId(hostsHere.length === 1 ? hostsHere[0].id : "");
                }}
                placeholder="Search places…"
                isDisabled={site.places.length === 0}
                noOptionsMessage={() => "No place matches that search"}
              />
            )}
          </Field>
        ) : null}

        {askForHost ? (
          <Field
            id="book-host"
            label="Who is hosting you?"
            description={
              placeId && hostsForPlace.length === 0
                ? "Nobody is registered at that place, so there is no one to ask."
                : undefined
            }
            required
          >
            {(control) => (
              <SearchableSelect
                {...control}
                id={undefined}
                inputId={control.id}
                options={hostsForPlace.map((host) => ({
                  value: host.id,
                  label: host.display_name,
                }))}
                value={hostId}
                onChange={(chosen) => setHostId(chosen ?? "")}
                placeholder="Search hosts…"
                isDisabled={hostsForPlace.length === 0}
                noOptionsMessage={() => "No host matches that search"}
              />
            )}
          </Field>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
          When
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="book-check-in" label="Arriving" required>
            {(control) => (
              <input
                {...control}
                type="date"
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
                type="date"
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
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
          You
        </legend>

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
            Leave an email address or a phone number so your host can answer.
          </p>
        ) : null}

        <Field
          id="book-purpose"
          label="Purpose of your visit"
          description="Optional."
        >
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
            />
          )}
        </Field>
      </fieldset>

      {submit.isError ? (
        <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
          {parseApiError(submit.error).message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={!canSubmit} isLoading={submit.isPending}>
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
          Send request
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          This is a request, not a booking. Nothing is charged and no dates are
          held — your host accepts or declines it.
        </p>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
        <Home className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {site.requires_host
          ? "Only the person you choose can see and answer your request."
          : "The property answers your request."}
      </p>
    </form>
  );
}
