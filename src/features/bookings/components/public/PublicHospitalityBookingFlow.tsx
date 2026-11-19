"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { formatMoney } from "@/lib/currency";
import { formatDateRange, formatDateTime } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { PublicBookingPayment } from "../PublicBookingPayment";
import { attachmentUrl } from "@/features/files/api";
import { PublicBookingSteps } from "./PublicBookingSteps";
import { PublicBookingSummary } from "./PublicBookingSummary";
import { PublicCategoryChooser } from "./PublicCategoryChooser";
import {
  PublicGuestDetailsForm,
  type PublicGuestDetails,
} from "./PublicGuestDetailsForm";
import { PublicPayStep } from "./PublicPayStep";
import { PublicStaySearch } from "./PublicStaySearch";
import { defaultStayDates, nightsBetween, stayWindow } from "../../public-lib";
import type {
  PublicBookingCreated,
  PublicRoomCategory,
  PublicSiteBooking,
} from "../../public-api-types";
import {
  usePublicAvailability,
  useSubmitPublicBooking,
} from "../../public-queries";

/**
 * The hospitality booking flow: dates → room type → details → review.
 *
 * Four screens rather than one long form, because the three questions are
 * genuinely sequential: there is no point asking who is coming before the guest
 * knows whether the dates work.
 *
 * The guest never sees a room number. They buy a category, the property assigns
 * a room, and if that changes before arrival the guest's booking is unaffected —
 * which is the entire reason the two are separate.
 */
export function PublicHospitalityBookingFlow({
  siteSlug,
  site,
}: {
  siteSlug: string;
  site: PublicSiteBooking;
}) {
  const defaults = useMemo(defaultStayDates, []);
  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [roomsRequested, setRoomsRequested] = useState("1");
  const [searched, setSearched] = useState(false);
  const [category, setCategory] = useState<PublicRoomCategory | null>(null);
  const [rooms, setRooms] = useState(1);
  const [details, setDetails] = useState<PublicGuestDetails>({
    name: "",
    email: "",
    phone: "",
    notes: "",
    guestCount: "",
  });
  // Paying is the last step, not a button on a confirmation screen: the guest
  // chooses here whether this is a booking (paid now) or a reservation (held).
  const [finished, setFinished] = useState(false);

  const submit = useSubmitPublicBooking(siteSlug);
  const window = stayWindow(checkIn, checkOut);
  const nights = nightsBetween(checkIn, checkOut);

  const availability = usePublicAvailability({
    siteSlug,
    checkIn: window.checkInAt ?? "",
    checkOut: window.checkOutAt ?? "",
    enabled:
      searched && window.checkInAt !== null && window.checkOutAt !== null,
  });

  if (submit.isSuccess) {
    return (
      <div className="min-h-screen bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]">
        <PublicHotelHeader site={site} checkout />
        <PublicHotelHero site={site} compact />
        <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          <PublicBookingSteps current={finished ? 5 : 4} />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <section className="min-w-0 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] p-4 sm:p-6">
              {finished ? (
                <PublicBookingConfirmation
                  siteSlug={siteSlug}
                  created={submit.data}
                />
              ) : (
                <PublicPayStep
                  siteSlug={siteSlug}
                  created={submit.data}
                  onDone={() => setFinished(true)}
                />
              )}
            </section>
            <aside className="lg:sticky lg:top-4">
              <PublicBookingSummary
                siteName={site.site_name}
                checkInAt={submit.data.check_in_at}
                checkOutAt={submit.data.check_out_at}
                nights={submit.data.nights ?? nights}
                category={category}
                rooms={submit.data.rooms}
                guests={details.guestCount ? Number(details.guestCount) : null}
              />
            </aside>
          </div>
        </main>
      </div>
    );
  }

  function changeDate(field: "checkIn" | "checkOut" | "rooms", value: string) {
    if (field === "rooms") {
      setRoomsRequested(value);
      setCategory(null);
      setRooms(1);
      return;
    }
    // A new window means the previous answer no longer applies, so the guest is
    // asked to search again rather than being shown stale counts.
    setSearched(false);
    setStep(0);
    setCategory(null);
    setRooms(1);
    if (field === "checkIn") setCheckIn(value);
    else setCheckOut(value);
  }

  function search() {
    setSearched(true);
    setStep(1);
  }

  function choose(chosen: PublicRoomCategory, roomCount: number) {
    setCategory(chosen);
    setRooms(roomCount);
    setStep(2);
  }

  function submitStay(kind: "booking" | "reservation") {
    if (!category) return;
    submit.mutate({
      kind,
      place_id: null,
      place_group_id: category.id,
      rooms,
      host_party_id: null,
      check_in_at: window.checkInAt as string,
      check_out_at: window.checkOutAt as string,
      ...(details.guestCount
        ? { guest_count: Number(details.guestCount) }
        : {}),
      requester_name: details.name.trim(),
      requester_email: details.email.trim() || null,
      requester_phone: details.phone.trim() || null,
      notes: details.notes.trim() || null,
      purpose: null,
    });
  }

  const error = availability.isError
    ? parseApiError(availability.error).message
    : null;
  return (
    <div className="min-h-screen bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]">
      <PublicHotelHeader site={site} checkout={step >= 2} />

      <PublicHotelHero site={site} compact={step >= 2} />
      {step < 2 ? (
        <>
          {site.categories.length > 0 ? (
            <div
              id="booking"
              className="relative z-20 mx-auto -mt-10 w-full max-w-6xl px-4 sm:-mt-12 sm:px-6"
            >
              <PublicStaySearch
                checkIn={checkIn}
                checkOut={checkOut}
                rooms={roomsRequested}
                onChange={changeDate}
                onSearch={search}
                isSearching={availability.isFetching}
                searched={searched}
                error={error}
              />
            </div>
          ) : null}

          <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            {site.branding?.gallery?.length ? (
              <section id="gallery" className="min-w-0 lg:col-span-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {site.branding.gallery.slice(0, 8).map((path) => {
                    const url = attachmentUrl(path);
                    return url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- public API content
                      <img
                        key={path}
                        src={url}
                        alt={`${site.site_name} gallery`}
                        loading="lazy"
                        className="aspect-[4/3] w-full rounded-lg object-cover"
                      />
                    ) : null;
                  })}
                </div>
              </section>
            ) : null}
            {site.categories.length === 0 ? (
              <PanelState
                kind="empty"
                title="Rooms are not ready to book online"
                description="Please contact the property for availability and reservations."
              />
            ) : (
              <section id="rooms" className="min-w-0">
                {step === 0 ? (
                  <PublicRoomPreview categories={site.categories} />
                ) : (
                  <PublicCategoryChooser
                    categories={availability.data?.categories ?? []}
                    nights={nights}
                    isLoading={availability.isFetching}
                    error={error}
                    onRetry={() => void availability.refetch()}
                    onChoose={choose}
                    minimumRooms={Number(roomsRequested) || 1}
                  />
                )}
              </section>
            )}
            <aside className="lg:sticky lg:top-4">
              <PublicBookingSummary
                siteName={site.site_name}
                checkInAt={window.checkInAt ?? ""}
                checkOutAt={window.checkOutAt ?? ""}
                nights={nights}
                category={category}
                rooms={category ? rooms : Number(roomsRequested) || 1}
                guests={details.guestCount ? Number(details.guestCount) : null}
              />
            </aside>
          </main>
        </>
      ) : (
        <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          <PublicBookingSteps current={step} />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <section className="min-w-0 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] p-4 sm:p-6">
              {step === 2 ? (
                <PublicGuestDetailsForm
                  details={details}
                  onChange={(field, value) =>
                    setDetails((current) => ({ ...current, [field]: value }))
                  }
                  onBack={() => setStep(1)}
                  onContinue={() => setStep(3)}
                  error={null}
                />
              ) : (
                <PublicBookingReview
                  details={details}
                  submit={submit}
                  onBack={() => setStep(2)}
                  onSubmit={submitStay}
                />
              )}
            </section>
            <aside className="lg:sticky lg:top-4">
              <PublicBookingSummary
                siteName={site.site_name}
                checkInAt={window.checkInAt ?? ""}
                checkOutAt={window.checkOutAt ?? ""}
                nights={nights}
                category={category}
                rooms={rooms}
                guests={details.guestCount ? Number(details.guestCount) : null}
              />
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}

function PublicHotelHeader({
  site,
  checkout,
}: {
  site: PublicSiteBooking;
  checkout: boolean;
}) {
  return (
    <header className="relative z-30 border-b border-[var(--vms-line)] bg-[var(--vms-surface)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a
          href="#top"
          className="font-serif text-xl font-semibold tracking-tight"
        >
          {site.site_name}
        </a>
        <nav
          aria-label="Hotel navigation"
          className="flex items-center gap-4 text-sm"
        >
          {!checkout ? (
            <a
              className="hidden text-[var(--vms-ink-muted)] sm:block"
              href="#rooms"
            >
              Rooms &amp; suites
            </a>
          ) : null}
          {!checkout && site.site_address ? (
            <a
              className="hidden text-[var(--vms-ink-muted)] sm:block"
              href="#location"
            >
              Location
            </a>
          ) : null}
          <a
            href={checkout ? "#top" : "#booking"}
            className="rounded-md bg-[var(--vms-ink)] px-4 py-2 font-semibold text-[var(--vms-surface)]"
          >
            {checkout ? site.site_name : "Book now"}
          </a>
        </nav>
      </div>
    </header>
  );
}

function PublicHotelHero({
  site,
  compact = false,
}: {
  site: PublicSiteBooking;
  compact?: boolean;
}) {
  return (
    <section
      id="top"
      className={`relative isolate overflow-hidden bg-[var(--vms-ink)] text-white ${compact ? "min-h-40 sm:min-h-48" : "min-h-[23rem] sm:min-h-[27rem]"}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${attachmentUrl(site.branding?.cover_url) ?? "/images/hospitality/hero-demo.webp"}')`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent"
      />
      <div
        className={`relative mx-auto flex max-w-6xl flex-col justify-end px-4 sm:px-6 ${compact ? "min-h-40 py-6 sm:min-h-48" : "min-h-[23rem] pb-16 pt-12 sm:min-h-[27rem] sm:pb-20"}`}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
          Stay with us
        </p>
        <div className="flex items-center gap-3">
          {site.branding?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- public API content
            <img
              src={attachmentUrl(site.branding.logo_url) ?? undefined}
              alt=""
              className="size-11 rounded-lg bg-white/90 object-contain p-1"
            />
          ) : null}
          <h1
            className={`max-w-2xl font-serif leading-tight ${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-6xl"}`}
          >
            {site.site_name}
          </h1>
        </div>
        {!compact && (site.branding?.description || site.site_description) ? (
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90">
            {site.branding?.description || site.site_description}
          </p>
        ) : null}
        {!compact && site.site_address ? (
          <p
            id="location"
            className="mt-4 flex items-start gap-2 text-sm text-white/85"
          >
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {site.site_address}
          </p>
        ) : null}

      </div>
    </section>
  );
}

function PublicRoomPreview({
  categories,
}: {
  categories: PublicRoomCategory[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vms-ink-muted)]">
            Accommodation
          </p>
          <h2 className="mt-1 font-serif text-3xl">Rooms &amp; suites</h2>
        </div>
        <p className="max-w-md text-sm text-[var(--vms-ink-muted)]">
          Choose your dates above to see live availability.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {categories.map((category, index) => (
          <li
            key={category.id}
            className="overflow-hidden rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)]"
          >
            <div className="grid sm:grid-cols-[13rem_minmax(0,1fr)]">
              <div className="relative h-32 sm:h-44">
                {category.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- public API content
                  <img
                    src={attachmentUrl(category.images[0]) ?? undefined}
                    alt={category.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                    <Image
                      src={
                        index % 2 === 0
                          ? "/images/hospitality/room-demo.webp"
                          : "/images/hospitality/suite-demo.webp"
                      }
                      alt="Illustrative room interior"
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 208px"
                      className="object-cover"
                    />
                )}
                {!category.images?.[0] ? (
                  <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
                    Demo photo
                  </span>
                ) : null}
              </div>
              <div className="flex min-h-[11rem] flex-col justify-between gap-2 p-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h3 className="font-serif text-xl font-semibold">
                    {category.name}
                  </h3>
                  {category.description ? (
                    <p className="mt-1 line-clamp-1 h-4 text-xs leading-4 text-[var(--vms-ink-muted)]">
                      {category.description}
                    </p>
                  ) : null}
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--vms-ink-muted)]">
                    {category.capacity ? (
                      <li>Sleeps {category.capacity}</li>
                    ) : null}
                    {category.amenities.slice(0, 3).map((amenity) => (
                      <li key={amenity}>{amenity.replaceAll("_", " ")}</li>
                    ))}
                  </ul>
                </div>
                <div className="shrink-0 sm:text-right">
                  {category.nightly_rate && category.currency ? (
                    <p className="text-sm font-semibold">
                      <span className="mr-1 text-[10px] font-normal text-[var(--vms-ink-muted)]">
                        From
                      </span>
                      {formatMoney(category.nightly_rate, category.currency)}
                      <span className="ml-1 text-[10px] font-normal text-[var(--vms-ink-muted)]">
                        / night
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--vms-ink-muted)]">
                      Price on request
                    </p>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PublicBookingReview({
  details,
  submit,
  onBack,
  onSubmit,
}: {
  details: PublicGuestDetails;
  submit: ReturnType<typeof useSubmitPublicBooking>;
  onBack: () => void;
  onSubmit: (kind: "booking" | "reservation") => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-2xl">Review your request</h2>
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
          Check your details and choose how to proceed.
        </p>
      </div>
      <dl className="grid gap-3 border-y border-[var(--vms-line)] py-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[var(--vms-ink-muted)]">Lead guest</dt>
          <dd className="mt-1 font-medium">{details.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--vms-ink-muted)]">Contact</dt>
          <dd className="mt-1 break-all font-medium">
            {details.email || details.phone}
          </dd>
        </div>
        {details.guestCount ? (
          <div>
            <dt className="text-xs text-[var(--vms-ink-muted)]">Guests</dt>
            <dd className="mt-1 font-medium">{details.guestCount}</dd>
          </div>
        ) : null}
        {details.notes ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-[var(--vms-ink-muted)]">
              Special requests
            </dt>
            <dd className="mt-1 font-medium">{details.notes}</dd>
          </div>
        ) : null}
      </dl>
      {submit.isError ? (
        <p
          role="alert"
          className="text-sm font-medium text-[var(--vms-danger)]"
        >
          {parseApiError(submit.error).message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col justify-between gap-3 rounded-lg border border-[var(--vms-border)] p-4">
          <div>
            <h3 className="font-semibold">Reserve the rooms</h3>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              Hold this stay and decide about payment later.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={submit.isPending}
            onClick={() => onSubmit("reservation")}
          >
            Reserve — pay later
          </Button>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-lg border border-[var(--vms-border)] p-4">
          <div>
            <h3 className="font-semibold">Book with payment</h3>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              Submit the request, then complete payment with the provider.
            </p>
          </div>
          <Button
            type="button"
            disabled={submit.isPending}
            isLoading={submit.isPending}
            onClick={() => onSubmit("booking")}
          >
            Pay and book
          </Button>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="self-start"
        onClick={onBack}
      >
        Back to guest details
      </Button>
    </div>
  );
}

/**
 * What the guest gets once they have finished the flow.
 *
 * Explicit that this is a request: the property has not accepted it yet. Paying
 * happened on the step before this one, so this screen does not ask for money
 * again — it says what has been sent and what happens next.
 */
export function PublicBookingConfirmation({
  siteSlug,
  created,
}: {
  siteSlug: string;
  created: PublicBookingCreated;
}) {
  const subject = created.room_category_name ?? created.place_name;
  const paid = created.payment_required && created.amount_due;

  return (
    <section className="mx-auto flex max-w-xl flex-col items-start gap-3 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface)] p-6">
      <span className="flex items-center gap-2 text-[var(--vms-success)]">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-base font-semibold">
          {paid ? "Booking sent" : "Reservation held"}
        </h1>
      </span>
      <p className="text-sm text-[var(--vms-ink)]">
        {created.site_name} has your
        {paid ? " booking" : " reservation"}
        {subject ? ` for ${subject}` : ""}
        {created.rooms > 1 ? ` (${created.rooms} rooms)` : ""}. Nothing is
        confirmed yet — you will hear back once someone has reviewed it.
      </p>
      <p className="text-xs text-[var(--vms-ink-muted)]">
        {formatDateRange(created.check_in_at, created.check_out_at)} ·{" "}
        {created.guest_count} {created.guest_count === 1 ? "guest" : "guests"}
      </p>
      {created.amount_due && created.currency ? (
        <p className="text-sm text-[var(--vms-ink)]">
          {formatMoney(created.amount_due, created.currency)}{" "}
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {paid ? "paid" : "for the stay"}
          </span>
        </p>
      ) : null}
      {!paid && created.hold_expires_at ? (
        <p className="text-xs text-[var(--vms-ink-muted)]">
          Your rooms are held until {formatDateTime(created.hold_expires_at)}.
          You can pay before then to keep them.
        </p>
      ) : null}
    </section>
  );
}

/** Nothing to show while the Site's catalogue is still being read. */
export function PublicBookingFlowLoading() {
  return (
    <PanelState
      kind="loading"
      title="Loading this Site's booking form"
      description="One moment."
    />
  );
}
