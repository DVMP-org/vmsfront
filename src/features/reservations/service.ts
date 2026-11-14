/**
 * Transport for the reservations API. No React, no caching policy — just calls.
 *
 * Returns the envelope, like every other service; the hooks unwrap it once.
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  ReservationDto,
  ReservationListParams,
  ReservationReleaseInput,
} from "./api-types";

export const reservationsService = {
  async list(
    params: ReservationListParams = {},
  ): Promise<ApiResponse<PaginatedResponse<ReservationDto>>> {
    return apiClient.get("/admin/reservations", {
      params: params as Record<string, unknown>,
    });
  },

  async confirm(reservationId: string): Promise<ApiResponse<ReservationDto>> {
    return apiClient.post(`/admin/reservations/${reservationId}/confirm`);
  },

  async allocate(
    reservationId: string,
    placeId: string,
  ): Promise<ApiResponse<ReservationDto>> {
    return apiClient.post(`/admin/reservations/${reservationId}/allocate`, {
      place_id: placeId,
    });
  },

  async release(
    reservationId: string,
    input: ReservationReleaseInput = { status: "cancelled" },
  ): Promise<ApiResponse<ReservationDto>> {
    return apiClient.post(
      `/admin/reservations/${reservationId}/release`,
      input,
    );
  },
};
