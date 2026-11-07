import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { VisitAuthorization } from "@/features/access-journey/api";

export type ApprovalStatus = "requested" | "approved" | "declined";

export const invitationApprovalsApi = {
  list: async (status: ApprovalStatus) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<VisitAuthorization>>>(
        "/admin/visit-authorizations",
        {
          params: {
            page: 1,
            page_size: 100,
            status,
          },
        },
      )
    ).data,
  approve: async (authorizationId: string) =>
    (
      await apiClient.post<ApiResponse<VisitAuthorization>>(
        `/admin/visit-authorizations/${authorizationId}/approve`,
      )
    ).data,
  decline: async (authorizationId: string, reason: string) =>
    (
      await apiClient.post<ApiResponse<VisitAuthorization>>(
        `/admin/visit-authorizations/${authorizationId}/decline`,
        { reason },
      )
    ).data,
};
