import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  CheckpointEvent,
  VisitAuthorization,
} from "@/features/access-journey/api";

export type ApprovalStatus =
  | "requested"
  | "approved"
  | "declined"
  | "expired"
  | "cancelled"
  | "revoked";

export type ApprovalFilter = ApprovalStatus | "all";

export interface InvitationListParams {
  status: ApprovalFilter;
  page?: number;
  pageSize?: number;
  search?: string;
  destinationPlaceId?: string;
}

export interface VisitSession {
  id: string;
  organization_id: string;
  visit_authorization_id: string;
  sequence_number: number;
  status: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export const invitationApprovalsApi = {
  list: async (input: ApprovalFilter | InvitationListParams) => {
    const params = typeof input === "string" ? { status: input } : input;
    return (
      await apiClient.get<ApiResponse<PaginatedResponse<VisitAuthorization>>>(
        "/admin/visit-authorizations",
        {
          params: {
            page: params.page ?? 1,
            page_size: params.pageSize ?? 25,
            ...(params.status !== "all" ? { status: params.status } : {}),
            ...(params.search?.trim() ? { search: params.search.trim() } : {}),
            ...(params.destinationPlaceId
              ? { destination_place_id: params.destinationPlaceId }
              : {}),
          },
        },
      )
    ).data;
  },
  get: async (authorizationId: string) =>
    (
      await apiClient.get<ApiResponse<VisitAuthorization>>(
        `/admin/visit-authorizations/${authorizationId}`,
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
  revoke: async (authorizationId: string) =>
    (
      await apiClient.post<ApiResponse<VisitAuthorization>>(
        `/admin/visit-authorizations/${authorizationId}/revoke`,
      )
    ).data,
  sessions: async (authorizationId: string) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<VisitSession>>>(
        `/admin/visit-authorizations/${authorizationId}/sessions`,
        { params: { page: 1, page_size: 100 } },
      )
    ).data,
  events: async (authorizationId: string) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<CheckpointEvent>>>(
        `/admin/visit-authorizations/${authorizationId}/checkpoint-events`,
        { params: { page: 1, page_size: 100 } },
      )
    ).data,
};
