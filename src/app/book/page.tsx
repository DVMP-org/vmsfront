"use client";

import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Home,
  Info,
  UsersRound,
} from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import {
  BookingApprovalActions,
  BookingDateRange,
  BookingStatusBadge,
  RequesterCell,
} from "@/features/bookings/components";
import type { BookingStatus, BookingSummary } from "@/features/bookings/types";
import { cn } from "@/lib/utils";

const RESIDENTIAL_PLACES = [
  { id: "unit-3b", name: "Maple Court · Unit 3B" },
  { id: "unit-12a", name: "Maple Court · Unit 12A" },
  { id: "unit-7", name: "Oak Residences · Unit 7" },
] as const;

const HOSTS_BY_PLACE: Record<
  string,
  Array<{ id: string; name: string; relationship: string }>
> = {
  "unit-3b": [
    { id: "ade-bola", name: "Ade Bola", relationship: "Resident · 3B" },
    { id: "chidi-okafor", name: "Chidi Okafor", relationship: "Resident · 3B" },
  ],
  "unit-12a": [
    { id: "ngozi-eze", name: "Ngozi Eze", relationship: "Resident · 12A" },
  ],
  "unit-7": [
    { id: "tunde-ade", name: "Tunde Adeyemi", relationship: "Resident · 7" },
    { id: "amina-bello", name: "Amina Bello", relationship: "Resident · 7" },
  ],
};

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function BookPage() {
  const [placeId, setPlaceId] = useState("");
  const [hostId, setHostId] = useState("");
  const [checkIn, setCheckIn] = useState(() => {
    const value = new Date();
    value.setHours(9, 0, 0, 0);
    return toLocalInput(value);
  });
  const [checkOut, setCheckOut] = useState(() => {
    const value = new Date();
    value.setHours(18, 0, 0, 0);
    return toLocalInput(value);
  });
  const [guestCount, setGuestCount] = useState("1");
  const [purpose, setPurpose] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [previewStatus, setPreviewStatus] = useState<BookingStatus>("requested");

  const hosts = HOSTS_BY_PLACE[placeId] ?? [];
  const place = RESIDENTIAL_PLACES.find((item) => item.id === placeId);
  const host = hosts.find((item) => item.id === hostId);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!place || !host) {
      setError("Choose the unit you're visiting and the resident you'd like to see.");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email so the resident can reach you.");
      return;
    }

    setBooking({
      id: "mock-booking-1",
      kind: "booking",
      domain: "residential",
      status: "requested",
      placeName: place.name,
      hostName: host.name,
      requester: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      },
      checkInAt: new Date(checkIn).toISOString(),
      checkOutAt: new Date(checkOut).toISOString(),
      guestCount: Number.parseInt(guestCount, 10) || 1,
      purpose: purpose.trim() || null,
    });
    setPreviewStatus("requested");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setBooking(null);
    setPlaceId("");
    setHostId("");
    setName("");
    setEmail("");
    setPhone("");
    setPurpose("");
    setError(null);
  }

  return (
    <main className="min-h-dvh bg-[var(--vms-surface)] text-[var(--vms-ink)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
            Residential · Bookings
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Book a visit
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Choose the unit and resident you&apos;d like to see. The resident is
            notified and, once they approve, you&apos;ll receive an invitation to
            check in at the gate.
          </p>
        </div>

        <div
          role="note"
          className="mb-6 flex items-start gap-2.5 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2.5 text-xs leading-5 text-[var(--vms-ink-muted)]"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            UI prototype. The form is interactive but nothing is sent — there is
            no bookings API yet.
          </p>
        </div>

        {booking ? (
          <Confirmation
            booking={booking}
            previewStatus={previewStatus}
            onApprove={() => setPreviewStatus("confirmed")}
            onDecline={() => setPreviewStatus("declined")}
            onReset={reset}
          />
        ) : (
          <form
            onSubmit={submit}
            className="space-y-6 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-6"
          >
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-[var(--vms-ink-muted)]" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Where are you visiting?</h2>
              </div>
              <Field id="booking-place" label="Unit" required>
                {(control) => (
                  <select
                    {...control}
                    value={placeId}
                    onChange={(event) => {
                      setPlaceId(event.target.value);
                      setHostId("");
                    }}
                    className={fieldControlClassName}
                  >
                    <option value="">Select a unit</option>
                    {RESIDENTIAL_PLACES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <fieldset>
                <legend className="mb-2 block text-[13px] font-semibold leading-[18px] text-[var(--vms-ink)]">
                  Who would you like to see?
                  <span aria-hidden="true" className="ml-0.5 text-[var(--vms-danger)]">
                    *
                  </span>
                  <span className="sr-only"> (required)</span>
                </legend>
                {placeId ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {hosts.map((item) => {
                      const selected = hostId === item.id;
                      return (
                        <label
                          key={item.id}
                          className={cn(
                            "flex min-h-16 cursor-pointer items-center gap-3 rounded-[var(--vms-radius-control)] border px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-[var(--vms-focus)] focus-within:ring-offset-1",
                            selected
                              ? "border-[var(--vms-ink)] bg-[var(--vms-surface-subtle)]"
                              : "border-[var(--vms-line)] hover:border-[var(--vms-line-strong)]",
                          )}
                        >
                          <input
                            type="radio"
                            name="booking-host"
                            value={item.id}
                            checked={selected}
                            onChange={() => setHostId(item.id)}
                            className="sr-only"
                          />
                          <Avatar name={item.name} size="sm" decorative />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-[var(--vms-ink)]">
                              {item.name}
                            </span>
                            <span className="block truncate text-xs text-[var(--vms-ink-muted)]">
                              {item.relationship}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--vms-ink-muted)]">
                    Select a unit first to see its residents.
                  </p>
                )}
              </fieldset>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-[var(--vms-ink-muted)]" aria-hidden="true" />
                <h2 className="text-sm font-semibold">When</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="booking-checkin" label="Check-in" required>
                  {(control) => (
                    <input
                      {...control}
                      type="datetime-local"
                      value={checkIn}
                      onChange={(event) => setCheckIn(event.target.value)}
                      className={fieldControlClassName}
                    />
                  )}
                </Field>
                <Field id="booking-checkout" label="Check-out" required>
                  {(control) => (
                    <input
                      {...control}
                      type="datetime-local"
                      value={checkOut}
                      onChange={(event) => setCheckOut(event.target.value)}
                      className={fieldControlClassName}
                    />
                  )}
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="booking-guests" label="Guests">
                  {(control) => (
                    <input
                      {...control}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={20}
                      value={guestCount}
                      onChange={(event) => setGuestCount(event.target.value)}
                      className={fieldControlClassName}
                    />
                  )}
                </Field>
                <Field id="booking-purpose" label="Purpose">
                  {(control) => (
                    <input
                      {...control}
                      value={purpose}
                      onChange={(event) => setPurpose(event.target.value)}
                      placeholder="Visit, delivery, family…"
                      className={fieldControlClassName}
                    />
                  )}
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-[var(--vms-ink-muted)]" aria-hidden="true" />
                <h2 className="text-sm font-semibold">About you</h2>
              </div>
              <Field id="booking-name" label="Your name" required>
                {(control) => (
                  <input
                    {...control}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    className={fieldControlClassName}
                  />
                )}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="booking-email" label="Email" required>
                  {(control) => (
                    <input
                      {...control}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      className={fieldControlClassName}
                    />
                  )}
                </Field>
                <Field id="booking-phone" label="Phone">
                  {(control) => (
                    <input
                      {...control}
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      autoComplete="tel"
                      className={fieldControlClassName}
                    />
                  )}
                </Field>
              </div>
            </section>

            {error ? (
              <p role="alert" className="text-sm font-medium text-[var(--vms-danger)]">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end border-t border-[var(--vms-line)] pt-4">
              <Button type="submit">
                Request booking
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function Confirmation({
  booking,
  previewStatus,
  onApprove,
  onDecline,
  onReset,
}: {
  booking: BookingSummary;
  previewStatus: BookingStatus;
  onApprove: () => void;
  onDecline: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5">
      <section
        aria-live="polite"
        className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Request submitted</h2>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--vms-ink-muted)]">
          {booking.hostName} has been notified of your request to visit{" "}
          {booking.placeName}. Here&apos;s what they&apos;ll see.
        </p>

        <dl className="mt-5 grid gap-x-5 gap-y-3 border-y border-[var(--vms-line)] py-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--vms-ink-muted)]">Requester</dt>
            <dd className="mt-1">
              <RequesterCell requester={booking.requester} />
            </dd>
          </div>
          <div>
            <dt className="text-[var(--vms-ink-muted)]">Visiting</dt>
            <dd className="mt-1 font-medium">{booking.hostName}</dd>
            <dd className="text-xs text-[var(--vms-ink-muted)]">
              {booking.placeName}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--vms-ink-muted)]">Window</dt>
            <dd className="mt-1">
              <BookingDateRange
                from={booking.checkInAt}
                to={booking.checkOutAt}
              />
            </dd>
          </div>
          <div>
            <dt className="text-[var(--vms-ink-muted)]">Guests</dt>
            <dd className="mt-1 font-medium">{booking.guestCount}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Resident preview</p>
              <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                Approve to issue the invitation, or decline with a reason.
              </p>
            </div>
            {previewStatus === "requested" ? (
              <BookingApprovalActions onApprove={onApprove} onDecline={onDecline} />
            ) : (
              <BookingStatusBadge status={previewStatus} />
            )}
          </div>
          {previewStatus === "confirmed" ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--vms-success)]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Approved — an invitation would be sent to {booking.requester.email}.
            </p>
          ) : null}
          {previewStatus === "declined" ? (
            <p className="mt-3 text-sm text-[var(--vms-danger)]">
              Declined — the requester would be notified with a reason.
            </p>
          ) : null}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onReset}>
          Start another request
        </Button>
      </div>
    </div>
  );
}
