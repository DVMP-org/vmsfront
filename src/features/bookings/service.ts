/**
 * Transport for the bookings API. No React, no caching policy — just calls.
 *
 * Every method returns the API envelope, because the server wraps every
 * successful body as `{ success, message, data }`. The hooks unwrap it once, so
 * components never see the envelope and the message never leaks into their data.
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { GuestFolio } from "@/features/hospitality/contracts";
import type {
  AdminBookingCreateInput,
  BookingChargeInput,
  BookingDetailDto,
  BookingDto,
  BookingFinancialsDto,
  BookingListParams,
  BookingPaymentDto,
  BookingUpdateInput,
  RecordBookingPaymentInput,
} from "./api-types";

export const bookingsService = {
  async create(
    input: AdminBookingCreateInput,
  ): Promise<ApiResponse<BookingDto>> {
    return apiClient.post("/admin/bookings", input);
  },

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

  /** Correct guest details, or move the stay before it starts. */
  async update(
    bookingId: string,
    input: BookingUpdateInput,
  ): Promise<ApiResponse<BookingDto>> {
    return apiClient.patch(`/admin/bookings/${bookingId}`, input);
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

  /** Call off a booking that was already agreed. Releases its rooms. */
  async cancel(
    bookingId: string,
    reason: string,
  ): Promise<ApiResponse<BookingDto>> {
    return apiClient.post(`/admin/bookings/${bookingId}/cancel`, { reason });
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

  /**
   * The guest's bill, or `null` before acceptance opened a stay.
   *
   * Read separately from the booking so a register or a drawer never downloads
   * a complete financial history it does not show.
   */
  async folio(bookingId: string): Promise<ApiResponse<GuestFolio | null>> {
    return apiClient.get(`/admin/bookings/${bookingId}/folio`);
  },

  /** Post something bought during the stay to the folio. */
  async addCharge(
    bookingId: string,
    input: BookingChargeInput,
  ): Promise<ApiResponse<BookingFinancialsDto>> {
    return apiClient.post(`/admin/bookings/${bookingId}/charges`, input);
  },

  /** Promote a reservation to a booking for every room it will occupy. */
  async convert(
    bookingId: string,
    placeIds: string[],
  ): Promise<ApiResponse<BookingDto>> {
    return apiClient.post(`/admin/bookings/${bookingId}/convert`, {
      place_ids: placeIds,
    });
  },
};
