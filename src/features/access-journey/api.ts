import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export type VisitAuthorizationStatus =
  "requested" | "approved" | "declined" | "expired" | "cancelled" | "revoked";

export interface VisitGuest {
  id: string;
  display_name_snapshot: string;
  email_snapshot: string | null;
  phone_snapshot: string | null;
  suffix: string;
}

export interface VisitAuthorization {
  id: string;
  created_by_user_id?: string | null;
  created_by_site_admin_id?: string | null;
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

export interface CheckpointEvent {
  id: string;
  organization_id: string;
  visit_authorization_id: string;
  visit_session_id: string | null;
  visit_guest_id: string;
  checkpoint_presence_id: string | null;
  place_id: string;
  gate_id: string;
  lane_id: string | null;
  direction: "entry" | "exit";
  outcome: "allowed" | "denied";
  reason_code: string;
  idempotency_key: string;
  scanned_by_admin_id: string | null;
  occurred_at: string;
  created_at: string;
}
export interface VisitGuestCredential {
  guest_id: string;
  display_name: string;
  suffix: string;
  credential_type: "invitation_qr";
  credential: string;
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
  get: async (authorizationId: string) =>
    (
      await apiClient.get<ApiResponse<VisitAuthorization>>(
        `/workspace/visit-authorizations/${authorizationId}`,
      )
    ).data,
  cancel: async (authorizationId: string) =>
    (
      await apiClient.post<ApiResponse<VisitAuthorization>>(
        `/workspace/visit-authorizations/${authorizationId}/cancel`,
      )
    ).data,
  checkpointEvents: async (authorizationId: string) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<CheckpointEvent>>>(
        `/workspace/visit-authorizations/${authorizationId}/checkpoint-events`,
        {
          params: {
            page: 1,
            page_size: 100,
          },
        },
      )
    ).data,
  credentials: async (authorizationId: string) =>
    (
      await apiClient.get<ApiResponse<VisitGuestCredential[]>>(
        `/workspace/visit-authorizations/${authorizationId}/credentials`,
      )
    ).data,
};
