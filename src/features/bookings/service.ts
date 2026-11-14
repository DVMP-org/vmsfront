/**
 * Transport for the bookings API. No React, no caching policy — just calls.
 *
 * Every method returns the API envelope, because the server wraps every
 * successful body as `{ success, message, data }`. The hooks unwrap it once, so
 * components never see the envelope and the message never leaks into their data.
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  BookingDetailDto,
  BookingDto,
  BookingListParams,
  BookingPaymentDto,
  RecordBookingPaymentInput,
} from "./api-types";

export const bookingsService = {
  async list(
    params: BookingListParams = {},
  ): Promise<ApiResponse<PaginatedResponse<BookingDto>>> {
    return apiClient.get("/admin/bookings", {
      params: params as Record<string, unknown>,
    });
  },

  async detail(bookingId: string): Promise<ApiResponse<BookingDetailDto>> {
    return apiClient.get(`/admin/bookings/${bookingId}`);
  },

  async approve(bookingId: string): Promise<ApiResponse<BookingDto>> {
    return apiClient.post(`/admin/bookings/${bookingId}/approve`);
  },

  async decline(
    bookingId: string,
    reason: string,
  ): Promise<ApiResponse<BookingDto>> {
    return apiClient.post(`/admin/bookings/${bookingId}/decline`, { reason });
  },

  async assignRoom(
    bookingId: string,
    placeId: string,
  ): Promise<ApiResponse<BookingDto>> {
    return apiClient.post(`/admin/bookings/${bookingId}/assign-room`, {
      place_id: placeId,
    });
  },

  async listPayments(
    bookingId: string,
  ): Promise<ApiResponse<BookingPaymentDto[]>> {
    return apiClient.get(`/admin/bookings/${bookingId}/payments`);
  },

  async recordPayment(
    bookingId: string,
    input: RecordBookingPaymentInput,
  ): Promise<ApiResponse<BookingPaymentDto>> {
    return apiClient.post(`/admin/bookings/${bookingId}/payments`, input);
  },
};
