"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { formatMoney } from "@/lib/currency";
import { formatDateRange } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { PublicBookingPayment } from "../PublicBookingPayment";
import { PublicBookingSteps } from "./PublicBookingSteps";
import { PublicBookingSummary } from "./PublicBookingSummary";
import { PublicCategoryChooser } from "./PublicCategoryChooser";
import { PublicGuestDetailsForm, type PublicGuestDetails } from "./PublicGuestDetailsForm";
import { PublicStaySearch } from "./PublicStaySearch";
import {
  defaultStayDates,
  nightsBetween,
  stayWindow,
} from "../../public-lib";
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
  const [guests, setGuests] = useState("2");
  const [searched, setSearched] = useState(false);
  const [category, setCategory] = useState<PublicRoomCategory | null>(null);
  const [rooms, setRooms] = useState(1);
  const [details, setDetails] = useState<PublicGuestDetails>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const submit = useSubmitPublicBooking(siteSlug);
  const window = stayWindow(checkIn, checkOut);
  const nights = nightsBetween(checkIn, checkOut);

  const availability = usePublicAvailability({
    siteSlug,
    checkIn: window.checkInAt ?? "",
    checkOut: window.checkOutAt ?? "",
    enabled: searched && window.checkInAt !== null && window.checkOutAt !== null,
  });

  if (submit.isSuccess) {
    return (
      <PublicBookingConfirmation siteSlug={siteSlug} created={submit.data} />
    );
  }

  function changeDate(field: "checkIn" | "checkOut" | "guests", value: string) {
    if (field === "guests") {
      setGuests(value);
      return;
    }
    // A new window means the previous answer no longer applies, so the guest is
    // asked to search again rather than being shown stale counts.
    setSearched(false);
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

  function submitBooking() {
    if (!category) return;
    submit.mutate({
      kind: "booking",
      place_id: null,
      place_group_id: category.id,
      rooms,
      host_party_id: null,
      check_in_at: window.checkInAt as string,
      check_out_at: window.checkOutAt as string,
      guest_count: Math.max(1, Number(guests) || 1),
      requester_name: details.name.trim(),
      requester_email: details.email.trim() || null,
      requester_phone: details.phone.trim() || null,
      notes: details.notes.trim() || null,
      purpose: null,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-[var(--vms-ink)]">
          Book a stay at {site.site_name}
        </h1>
        <p className="text-sm text-[var(--vms-ink-muted)]">
          Choose your dates, then the type of room. We assign the room itself.
        </p>
        <PublicBookingSteps current={step} />
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="min-w-0 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface)] p-4 sm:p-5">
          {step === 0 ? (
            <PublicStaySearch
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              onChange={changeDate}
              onSearch={search}
              isSearching={false}
              error={null}
            />
          ) : null}

          {step === 1 ? (
            <PublicCategoryChooser
              categories={availability.data?.categories ?? []}
              nights={nights}
              checkInAt={window.checkInAt ?? ""}
              checkOutAt={window.checkOutAt ?? ""}
              isLoading={availability.isPending}
              error={
                availability.isError
                  ? parseApiError(availability.error).message
                  : null
              }
              onBack={() => {
                setSearched(false);
                setStep(0);
              }}
              onChoose={choose}
            />
          ) : null}

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
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[var(--vms-ink)]">
                Check the details below. Nothing is charged on this screen — the
                property confirms your request, and you can pay for it after.
              </p>
              {submit.isError ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-[var(--vms-danger)]"
                >
                  {parseApiError(submit.error).message}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={submit.isPending}
                  isLoading={submit.isPending}
                  onClick={submitBooking}
                >
                  Request this stay
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-4">
          <PublicBookingSummary
            siteName={site.site_name}
            checkInAt={window.checkInAt ?? ""}
            checkOutAt={window.checkOutAt ?? ""}
            nights={nights}
            category={category}
            rooms={rooms}
            guests={Math.max(1, Number(guests) || 1)}
          />
        </aside>
      </div>
    </div>
  );
}

/**
 * What the guest gets once the request is in.
 *
 * Explicit that this is a request: the property has not accepted it yet. The
 * payment block exists because paying is the next thing a guest wants to do, and
 * paying does not confirm the stay either.
 */
export function PublicBookingConfirmation({
  siteSlug,
  created,
}: {
  siteSlug: string;
  created: PublicBookingCreated;
}) {
  const subject = created.room_category_name ?? created.place_name;

  return (
    <section className="mx-auto flex max-w-xl flex-col items-start gap-3 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface)] p-6">
      <span className="flex items-center gap-2 text-[var(--vms-success)]">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-base font-semibold">Request sent</h1>
      </span>
      <p className="text-sm text-[var(--vms-ink)]">
        {created.site_name} has your request
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
            for the stay
          </span>
        </p>
      ) : null}
      <PublicBookingPayment siteSlug={siteSlug} booking={created} />
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
