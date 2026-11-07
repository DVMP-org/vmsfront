import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export type VisitAuthorizationStatus =
  "requested" | "approved" | "declined" | "expired" | "cancelled";

export interface VisitGuest {
  id: string;
  display_name_snapshot: string;
  email_snapshot: string | null;
  phone_snapshot: string | null;
  suffix: string;
}

export interface VisitAuthorization {
  id: string;
  host_party_id: string;
  destination_place_id: string;
  code: string;
  qr_code_url: string | null;
  status: VisitAuthorizationStatus;
  valid_from: string;
  valid_to: string;
  max_uses: number | null;
  uses_count: number;
  purpose: string | null;
  additional_information: string | null;
  decline_reason: string | null;
  requested_at: string;
  decided_at: string | null;
  host_party: {
    display_name: string;
  };
  destination_place: {
    id: string;
    name: string;
    kind: string;
    address: string;
  };
  guests: VisitGuest[];
}

export interface CreateVisitAuthorizationInput {
  destination_place_id: string;
  valid_from: string;
  valid_to: string;
  max_uses: number;
  purpose: string | null;
  guests: Array<{
    display_name: string;
    email?: string;
    phone?: string;
  }>;
}

export const accessJourneyApi = {
  list: async (destinationPlaceId: string) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<VisitAuthorization>>>(
        "/workspace/visit-authorizations",
        {
          params: {
            page: 1,
            page_size: 100,
            destination_place_id: destinationPlaceId,
          },
        },
      )
    ).data,
  create: async (body: CreateVisitAuthorizationInput) =>
    (
      await apiClient.post<ApiResponse<VisitAuthorization>>(
        "/workspace/visit-authorizations",
        body,
      )
    ).data,
  cancel: async (authorizationId: string) =>
    (
      await apiClient.post<ApiResponse<VisitAuthorization>>(
        `/workspace/visit-authorizations/${authorizationId}/cancel`,
      )
    ).data,
};
