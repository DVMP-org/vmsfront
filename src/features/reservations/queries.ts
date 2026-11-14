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
  ReservationListParams,
  ReservationReleaseInput,
} from "./api-types";

export const reservationKeys = {
  all: ["reservations"] as const,
  list: (params: ReservationListParams) =>
    ["reservations", "list", params] as const,
};

export function useReservations(params: ReservationListParams = {}) {
  return useQuery({
    queryKey: reservationKeys.list(params),
    queryFn: async () => unwrap(await reservationsService.list(params)),
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
