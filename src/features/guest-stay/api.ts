import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  GuestFolio,
  GuestHousekeepingRequest,
  GuestRoomHousekeeping,
  Stay,
} from "@/features/hospitality/contracts";

export const guestStayApi = {
  list: async () =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Stay>>>(
        "/workspace/hospitality/stays",
        {
          params: {
            page: 1,
            page_size: 20,
          },
        },
      )
    ).data,
  get: async (stayId: string) =>
    (
      await apiClient.get<ApiResponse<Stay>>(
        `/workspace/hospitality/stays/${stayId}`,
      )
    ).data,
  /**
   * The guest's own bill. The server answers only for a stay the caller is on,
   * so an unknown id is a 404 rather than somebody else's folio.
   */
  folio: async (stayId: string) =>
    (
      await apiClient.get<ApiResponse<GuestFolio>>(
        `/workspace/hospitality/stays/${stayId}/folio`,
      )
    ).data,
  /**
   * Housekeeping state of the guest's own room. The server resolves the room
   * from the stay, so the guest never names a room id.
   */
  housekeeping: async (stayId: string) =>
    (
      await apiClient.get<ApiResponse<GuestRoomHousekeeping>>(
        `/workspace/hospitality/stays/${stayId}/housekeeping`,
      )
    ).data,
  setHousekeeping: async (
    stayId: string,
    status: GuestHousekeepingRequest,
  ) =>
    (
      await apiClient.patch<ApiResponse<GuestRoomHousekeeping>>(
        `/workspace/hospitality/stays/${stayId}/housekeeping`,
        { status },
      )
    ).data,
};
