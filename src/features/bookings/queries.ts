/**
 * Query and mutation hooks for the bookings register.
 *
 * Components import from here rather than calling the service, so cache
 * invalidation lives in one place: every decision, room assignment and payment
 * affects both the row and the trail, and forgetting one of those is how a
 * register starts lying about what happened.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api-envelope";
import { bookingsService } from "./service";
import type {
  AdminBookingCreateInput,
  BookingListParams,
  RecordBookingPaymentInput,
} from "./api-types";

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (params: BookingListParams) => ["bookings", "list", params] as const,
  detail: (bookingId: string | null) =>
    ["bookings", "detail", bookingId] as const,
  payments: (bookingId: string | null) =>
    ["bookings", "payments", bookingId] as const,
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

export function useDeclineBooking(bookingId: string) {
  return useDecisionMutation(bookingId, async (reason: string) =>
    unwrap(await bookingsService.decline(bookingId, reason)),
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
