/**
 * Query and mutation hooks for the bookings register.
 *
 * Components import from here rather than calling the service, so cache
 * invalidation lives in one place: every decision, room assignment and payment
 * affects both the row and the trail, and forgetting one of those is how a
 * register starts lying about what happened.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { unwrap } from "@/lib/api-envelope";
import { parseApiError } from "@/lib/error-utils";
import { bookingsService } from "./service";
import type {
  AdminBookingCreateInput,
  BookingChargeInput,
  BookingListParams,
  BookingUpdateInput,
  RecordBookingPaymentInput,
} from "./api-types";

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (params: BookingListParams) => ["bookings", "list", params] as const,
  detail: (bookingId: string | null) =>
    ["bookings", "detail", bookingId] as const,
  payments: (bookingId: string | null) =>
    ["bookings", "payments", bookingId] as const,
  folio: (bookingId: string | null) =>
    ["bookings", "folio", bookingId] as const,
};

export function useBookings(params: BookingListParams = {}) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: async () => unwrap(await bookingsService.list(params)),
  });
}

export function useBooking(bookingId: string | null) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: async () =>
      unwrap(await bookingsService.detail(bookingId as string)),
    enabled: Boolean(bookingId),
  });
}

export function useBookingPayments(bookingId: string | null) {
  return useQuery({
    queryKey: bookingKeys.payments(bookingId),
    queryFn: async () =>
      unwrap(await bookingsService.listPayments(bookingId as string)),
    enabled: Boolean(bookingId),
  });
}

/**
 * The guest's bill, loaded only where it is shown.
 *
 * The directory and the quick-view drawer read the financial summary that comes
 * with the booking; this is for the details page's folio tab, so opening a
 * register does not download every guest's line items.
 */
export function useBookingFolio(bookingId: string | null) {
  return useQuery({
    queryKey: bookingKeys.folio(bookingId),
    queryFn: async () =>
      unwrap(await bookingsService.folio(bookingId as string)),
    enabled: Boolean(bookingId),
  });
}

/** One decision refreshes the row, its trail, and any list showing it. */
function useDecisionMutation<TArgs>(
  bookingId: string,
  mutationFn: (args: TArgs) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useApproveBooking(bookingId: string) {
  return useDecisionMutation(bookingId, async () =>
    unwrap(await bookingsService.approve(bookingId)),
  );
}

/**
 * Send the guest their acceptance magic link again.
 *
 * This is not a decision, so it does not refresh the register; only the booking
 * it belongs to changes, and its trail records who sent it.
 */
export function useResendBookingOnboarding(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      unwrap(await bookingsService.resendOnboarding(bookingId)),
    onSuccess: async (receipt) => {
      toast.success(`Magic link sent to ${receipt.email}`);
      await queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
    },
    onError: (error) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useDeclineBooking(bookingId: string) {
  return useDecisionMutation(bookingId, async (reason: string) =>
    unwrap(await bookingsService.decline(bookingId, reason)),
  );
}

/**
 * Cancelling ends an agreed booking, so it releases capacity as well as changing
 * a status. Invalidating `bookingKeys.all` refreshes the reservations surfaces
 * too, because the room is sellable again the moment this succeeds.
 */
export function useCancelBooking(bookingId: string) {
  return useDecisionMutation(bookingId, async (reason: string) =>
    unwrap(await bookingsService.cancel(bookingId, reason)),
  );
}

/**
 * Correct a booking without cancelling it.
 *
 * The server may move capacity or the stay as part of a date change, so the whole
 * booking cache is invalidated: the row, its trail and the reservations surfaces
 * all describe the same thing.
 */
export function useUpdateBooking(bookingId: string) {
  return useDecisionMutation(bookingId, async (input: BookingUpdateInput) =>
    unwrap(await bookingsService.update(bookingId, input)),
  );
}

export function useAssignBookingRoom(bookingId: string) {
  return useDecisionMutation(bookingId, async (placeId: string) =>
    unwrap(await bookingsService.assignRoom(bookingId, placeId)),
  );
}

export function useRecordBookingPayment(bookingId: string) {
  return useDecisionMutation(
    bookingId,
    async (input: RecordBookingPaymentInput) =>
      unwrap(await bookingsService.recordPayment(bookingId, input)),
  );
}

/**
 * Post something bought during the stay to the guest's folio.
 *
 * Not optimistic: the bill is what the desk collects, so the summary shown after
 * saving is the server's — a line that failed to persist must never appear in a
 * total somebody is about to charge for.
 */
export function useAddBookingCharge(bookingId: string) {
  return useDecisionMutation(bookingId, async (input: BookingChargeInput) =>
    unwrap(await bookingsService.addCharge(bookingId, input)),
  );
}

/**
 * Confirm a reservation into a booking by naming its room.
 *
 * The server does both steps, so success means a booking with a stay, a badge
 * and the reservation's money already posted. The whole booking cache is
 * invalidated: the row leaves the reservations register in the same breath.
 */
export function useConvertReservation(bookingId: string) {
  return useDecisionMutation(bookingId, async (placeIds: string[]) =>
    unwrap(await bookingsService.convert(bookingId, placeIds)),
  );
}

/** Taking a booking puts a new row in the register, so the register refreshes. */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminBookingCreateInput) =>
      unwrap(await bookingsService.create(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
