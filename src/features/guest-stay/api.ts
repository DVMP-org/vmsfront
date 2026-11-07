import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Stay } from "@/features/hospitality/contracts";

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
};
