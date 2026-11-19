"use client";

import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PublicBookingForm } from "../PublicBookingForm";
import { PublicHospitalityBookingFlow } from "./PublicHospitalityBookingFlow";
import { usePublicSiteBooking } from "../../public-queries";
import type { PublicSiteBooking } from "../../public-api-types";

/**
 * The Site's public page, in whichever shape the Site actually sells.
 *
 * A hotel sells room categories and assigns a room afterwards, so hospitality
 * gets the four-step flow. Everything else asks for the place — and, for
 * residential, the resident being visited — through the form that already does
 * that.
 *
 * The server's domain decides which public entry point owns the page.
 */
export function PublicBookingEntry({ siteSlug }: { siteSlug: string }) {
  const catalogue = usePublicSiteBooking(siteSlug);

  if (catalogue.isPending) {
    return (
      <PublicEntryState
        loading
        title="Finding your stay"
        detail="Loading room types and booking details."
      />
    );
  }

  if (catalogue.isError || !catalogue.data) {
    return (
      <PublicEntryState
        title="We couldn't load this booking page"
        detail="Check your connection and try again."
        retry={() => void catalogue.refetch()}
        isRetrying={catalogue.isFetching}
      />
    );
  }

  const site = catalogue.data;

  switch (site.domain) {
    case "hospitality":
      return <PublicHospitalityBookingFlow siteSlug={siteSlug} site={site} />;
    case "residential":
      return <ResidentialBookingEntry siteSlug={siteSlug} site={site} />;
    case "commercial":
    case "mixed_use":
      return <CommercialBookingEntry siteSlug={siteSlug} site={site} />;
    default:
      return (
        <PanelState
          kind="error"
          title="Booking is unavailable"
          description="This site's booking experience is not configured."
        />
      );
  }
}

function PublicEntryState({
  loading = false,
  title,
  detail,
  retry,
  isRetrying = false,
}: {
  loading?: boolean;
  title: string;
  detail: string;
  retry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--vms-surface-subtle)] px-4 py-12">
      <section
        role={loading ? "status" : "alert"}
        className="flex w-full max-w-md flex-col items-center rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] px-6 py-10 text-center shadow-sm sm:px-10"
      >
        <span className="mb-5 grid size-14 place-items-center rounded-full bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]">
          {loading ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-7 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <AlertCircle aria-hidden="true" className="size-7" />
          )}
        </span>
        <h1 className="font-serif text-2xl font-semibold text-[var(--vms-ink)]">
          {title}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--vms-ink-muted)]">
          {detail}
        </p>
        {retry ? (
          <Button
            type="button"
            className="mt-6 min-w-36"
            isLoading={isRetrying}
            onClick={retry}
          >
            {!isRetrying ? (
              <RefreshCw aria-hidden="true" className="size-4" />
            ) : null}
            Try again
          </Button>
        ) : null}
      </section>
    </main>
  );
}

function ResidentialBookingEntry({
  siteSlug,
  site,
}: {
  siteSlug: string;
  site: PublicSiteBooking;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PublicBookingForm siteSlug={siteSlug} catalogue={site} />
    </div>
  );
}

function CommercialBookingEntry({
  siteSlug,
  site,
}: {
  siteSlug: string;
  site: PublicSiteBooking;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PublicBookingForm siteSlug={siteSlug} catalogue={site} />
    </div>
  );
}
