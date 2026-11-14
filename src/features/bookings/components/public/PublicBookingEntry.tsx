"use client";

import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { PublicBookingForm } from "../PublicBookingForm";
import { PublicHospitalityBookingFlow } from "./PublicHospitalityBookingFlow";
import { usePublicSiteBooking } from "../../public-queries";

/**
 * The Site's public page, in whichever shape the Site actually sells.
 *
 * A hotel sells room categories and assigns a room afterwards, so hospitality
 * gets the four-step flow. Everything else asks for the place — and, for
 * residential, the resident being visited — through the form that already does
 * that.
 *
 * The catalogue decides, not the domain name in the URL, and a hospitality Site
 * whose rooms carry no category yet falls back to the room list rather than
 * showing an empty page. That is the state a Site is in between being created and
 * having its categories set up.
 */
export function PublicBookingEntry({ siteSlug }: { siteSlug: string }) {
  const catalogue = usePublicSiteBooking(siteSlug);

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

  const site = catalogue.data;

  if (site.domain === "hospitality" && site.categories.length > 0) {
    return (
      <PublicHospitalityBookingFlow siteSlug={siteSlug} site={site} />
    );
  }

  return <PublicBookingForm siteSlug={siteSlug} catalogue={site} />;
}
