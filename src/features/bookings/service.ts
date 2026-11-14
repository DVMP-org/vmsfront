/**
 * Transport for the bookings API. No React, no caching policy — just calls.
 *
 * Every endpoint here is Site-scoped and the API client already supplies the
 * selected Site, so nothing in this file has to think about tenancy.
 */

import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types";
import type {
  BookingDetailDto,
  BookingDto,
  BookingListParams,
  BookingPaymentDto,
  RecordBookingPaymentInput,
} from "./api-types";

export const bookingsService = {
  async list(params: BookingListParams = {}) {
    return apiClient.get<PaginatedResponse<BookingDto>>("/admin/bookings", {
      params: params as Record<string, unknown>,
    });
  },

  async detail(bookingId: string) {
    return apiClient.get<BookingDetailDto>(`/admin/bookings/${bookingId}`);
  },

  async approve(bookingId: string) {
    return apiClient.post<BookingDto>(`/admin/bookings/${bookingId}/approve`);
  },

  async decline(bookingId: string, reason: string) {
    return apiClient.post<BookingDto>(`/admin/bookings/${bookingId}/decline`, {
      reason,
    });
  },

  async assignRoom(bookingId: string, placeId: string) {
    return apiClient.post<BookingDto>(
      `/admin/bookings/${bookingId}/assign-room`,
      { place_id: placeId },
    );
  },

  async listPayments(bookingId: string) {
    return apiClient.get<BookingPaymentDto[]>(
      `/admin/bookings/${bookingId}/payments`,
    );
  },

  async recordPayment(bookingId: string, input: RecordBookingPaymentInput) {
    return apiClient.post<BookingPaymentDto>(
      `/admin/bookings/${bookingId}/payments`,
      input,
    );
  },
};
