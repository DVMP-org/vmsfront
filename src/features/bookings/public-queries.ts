"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { unwrap } from "@/lib/api-envelope";
import type { ApiResponse } from "@/types";
import type {
  PublicBookingCreated,
  PublicBookingInput,
  PublicSiteBooking,
} from "./public-api-types";

/**
 * The unauthenticated booking form's data.
 *
 * These calls are deliberately outside the admin service: a visitor has no
 * session, and the tenant comes from the host they arrived on, not from anything
 * they send.
 *
 * Both the query and the mutation unwrap the API envelope, so the form deals in
 * the catalogue and the created booking rather than in transport wrappers.
 */

export const publicBookingKeys = {
  catalogue: (siteSlug: string) =>
    ["public", "booking", siteSlug] as const,
};

export function usePublicSiteBooking(siteSlug: string) {
  return useQuery({
    queryKey: publicBookingKeys.catalogue(siteSlug),
    queryFn: async () =>
      unwrap(
        await apiClient.get<ApiResponse<PublicSiteBooking>>(
          `/public/sites/${siteSlug}/booking`,
        ),
      ),
    enabled: Boolean(siteSlug),
    // A refused submission is a visitor problem, not a stale-cache problem.
    retry: false,
  });
}

export function useSubmitPublicBooking(siteSlug: string) {
  return useMutation({
    mutationFn: async (input: PublicBookingInput) =>
      unwrap(
        await apiClient.post<ApiResponse<PublicBookingCreated>>(
          `/public/sites/${siteSlug}/bookings`,
          input,
        ),
      ),
  });
}
