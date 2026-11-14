/**
 * Query and mutation hooks for the reservations board.
 *
 * Every action here changes whether a room is occupied, so all three mutations
 * invalidate the whole reservation cache rather than patching a row. A room that
 * reads available while the server has already sold it is the one mistake this
 * screen cannot afford.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api-envelope";
import { reservationsService } from "./service";
import type {
  ReservationDto,
  ReservationListParams,
  ReservationReleaseInput,
} from "./api-types";

export const reservationKeys = {
  all: ["reservations"] as const,
  list: (params: ReservationListParams) =>
    ["reservations", "list", params] as const,
};

/**
 * How long until this page's answer goes stale.
 *
 * `is_holding` is a snapshot, and it changes without anyone touching the row: a
 * hold simply runs out. Leaving the board open would then show a lapsed hold as
 * still claiming a room until something else caused a refetch — the page would
 * become wrong by standing still.
 *
 * So the query wakes just after the soonest expiry it knows about, and never
 * waits longer than a minute in case a row it has not seen yet expires sooner.
 */
function refetchAfterNextExpiry(items: ReservationDto[]): number | false {
  const now = Date.now();
  const pending = items
    .filter((row) => row.status === "held" && row.expires_at)
    .map((row) => new Date(row.expires_at as string).getTime() - now)
    .filter((ms) => ms > 0);
  if (pending.length === 0) return false;
  return Math.min(Math.min(...pending) + 1_000, 60_000);
}

export function useReservations(params: ReservationListParams = {}) {
  return useQuery({
    queryKey: reservationKeys.list(params),
    queryFn: async () => unwrap(await reservationsService.list(params)),
    refetchInterval: (query) =>
      refetchAfterNextExpiry(query.state.data?.items ?? []),
  });
}

function useReservationAction<TArgs>(
  action: (args: TArgs) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      // Both surfaces read availability, and bookings embed it in their detail.
      void queryClient.invalidateQueries({ queryKey: reservationKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useConfirmReservation() {
  return useReservationAction<string>((reservationId) =>
    reservationsService.confirm(reservationId),
  );
}

export function useAllocateReservation() {
  return useReservationAction<{ reservationId: string; placeId: string }>(
    ({ reservationId, placeId }) =>
      reservationsService.allocate(reservationId, placeId),
  );
}

export function useReleaseReservation() {
  return useReservationAction<{
    reservationId: string;
    input?: ReservationReleaseInput;
  }>(({ reservationId, input }) =>
    reservationsService.release(reservationId, input),
  );
}
