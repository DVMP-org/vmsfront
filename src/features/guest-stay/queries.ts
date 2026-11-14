import { useQuery } from "@tanstack/react-query";

import { guestStayApi } from "./api";

/**
 * The guest's stay queries.
 *
 * These used to live inline in the dashboard. Moving them here is what lets the
 * folio be its own component without either file owning a cache key the other
 * has to guess.
 */

export const guestStayKeys = {
  all: ["workspace", "guest-stays"] as const,
  folio: (stayId: string) =>
    ["workspace", "guest-stays", stayId, "folio"] as const,
};

export function useGuestStays() {
  return useQuery({
    queryKey: guestStayKeys.all,
    queryFn: guestStayApi.list,
    retry: false,
  });
}

/** One stay's bill. A 404 here means the stay is not the caller's. */
export function useGuestStayFolio(stayId: string) {
  return useQuery({
    queryKey: guestStayKeys.folio(stayId),
    queryFn: () => guestStayApi.folio(stayId),
    retry: false,
  });
}
