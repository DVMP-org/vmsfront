import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type AccessCredentialType = "badge_qr" | "permanent_code";

export interface AccessCredential {
  id: string;
  credential_type: AccessCredentialType;
  label?: string | null;
  status: string;
  issued_at: string;
  expires_at?: string | null;
  suspended_at?: string | null;
  revoked_at?: string | null;
  last_used_at?: string | null;
  party: {
    id: string;
    kind: string;
    display_name: string;
    email?: string | null;
    is_active: boolean;
  };
  credential?: string;
  warning?: string;
}

export const accessCredentialsApi = {
  list: async (partyId: string) =>
    (
      await apiClient.get<ApiResponse<{ credentials: AccessCredential[] }>>(
        "/admin/access-credentials",
        { params: { party_id: partyId } },
      )
    ).data.credentials,
  issue: async (body: {
    party_id: string;
    credential_type: AccessCredentialType;
    label?: string;
    expires_at?: string;
  }) =>
    (
      await apiClient.post<ApiResponse<AccessCredential>>(
        "/admin/access-credentials",
        body,
      )
    ).data,
  lifecycle: async (
    credentialId: string,
    action: "suspend" | "revoke" | "replace",
  ) =>
    (
      await apiClient.post<ApiResponse<AccessCredential>>(
        `/admin/access-credentials/${credentialId}/lifecycle`,
        { action },
      )
    ).data,
};
