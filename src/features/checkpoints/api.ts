import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
export interface Gate {
  id: string;
  name: string;
  place_id?: string | null;
  allowed_entry?: boolean;
  allowed_exit?: boolean;
  automatic_direction?: boolean;
  manual_direction_override?: boolean;
  policy_version?: number;
}
export interface ActiveCheckpoint {
  id: string;
  name: string;
  place_id: string;
  place_name: string;
  allowed_entry: boolean;
  allowed_exit: boolean;
  automatic_direction: boolean;
  manual_direction_override: boolean;
  offline_policy?: "deny" | "queue" | "allow_verified";
  reentry_policy?: "allowed" | "denied" | "manual";
  allowed_credential_types?: string[];
  policy_version: number;
  operator_site_admin_id: string;
  operator_name: string;
}
export interface CheckpointConsoleContext extends ActiveCheckpoint {
  lanes: import("@/services/access-control-service").AccessLane[];
}
export interface CheckpointOperatorAssignment {
  id: string;
  gate_id: string;
  gate_name: string;
  place: {
    id: string;
    name: string;
    slug: string;
    kind: string;
    is_active: boolean;
  };
  site_admin: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      is_active: boolean;
    };
  };
  assigned_by_site_admin_id?: string | null;
  assigned_at: string;
  is_active: boolean;
}
export interface CheckpointOperatorAssignments {
  place_id?: string | null;
  assignments: CheckpointOperatorAssignment[];
}
export interface Passage {
  id: string;
  organization_id?: string;
  visit_authorization_id?: string | null;
  visit_session_id?: string | null;
  visit_guest_id?: string | null;
  party_id?: string | null;
  person_name?: string | null;
  subject_type?: "visitor" | "party" | "unknown";
  gate_id: string;
  gate_name?: string | null;
  place_id?: string;
  place_name?: string | null;
  lane_id?: string | null;
  direction: "entry" | "exit";
  outcome: string;
  reason_code: string;
  credential_type?: string | null;
  credential_reference?: string | null;
  state_before?: string | null;
  state_after?: string | null;
  policy_version?: number;
  operator_site_admin_id?: string | null;
  operator_name?: string | null;
  device_id?: string | null;
  manual_override?: boolean;
  override_reason?: string | null;
  idempotency_key?: string;
  occurred_at: string;
  created_at?: string;
  replayed?: boolean;
}
export interface PassageInput {
  authorization_code?: string;
  credential?: string;
  guest_suffix?: string;
  direction?: "entry" | "exit";
  lane_id?: string;
  idempotency_key: string;
  device_id?: string;
  manual_override?: boolean;
  override_reason?: string;
}
export interface AccessEventFilters {
  page?: number;
  page_size?: number;
  search?: string;
  place_id?: string;
  gate_id?: string;
  party_id?: string;
  subject_type?: string;
  credential_type?: string;
  direction?: string;
  outcome?: string;
  occurred_from?: string;
  occurred_to?: string;
  sort?: string;
}
export interface AccessPresence {
  subject_type: string;
  party_id?: string | null;
  person_name: string;
  place_id: string;
  place_name: string;
  gate_id?: string | null;
  gate_name?: string | null;
  state: string;
  since: string;
}
export interface CheckpointMovement {
  id: string;
  place_id: string;
  source_gate_id: string;
  source_gate_name: string;
  target_gate_id: string;
  target_gate_name: string;
  direction: "entry" | "exit";
  route_group: string;
  is_active: boolean;
  description?: string | null;
  created_at: string;
  updated_at: string;
}
export const checkpointsApi = {
  gates: async (page: number, search: string) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Gate>>>(
        "/admin/gates",
        { params: { page, page_size: 20, ...(search ? { search } : {}) } },
      )
    ).data,
  gate: async (id: string) =>
    (await apiClient.get<ApiResponse<Gate>>(`/admin/gate/${id}`)).data,
  active: async () =>
    (
      await apiClient.get<ApiResponse<ActiveCheckpoint>>(
        "/admin/checkpoints/active",
      )
    ).data,
  console: async (gateId: string) =>
    (
      await apiClient.get<ApiResponse<CheckpointConsoleContext>>(
        `/admin/checkpoints/${gateId}/console`,
      )
    ).data,
  myAssignments: async () =>
    (
      await apiClient.get<ApiResponse<CheckpointOperatorAssignments>>(
        "/admin/checkpoints/operators/mine",
      )
    ).data,
  history: async (id: string, page: number) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Passage>>>(
        `/admin/checkpoints/${id}/passages`,
        { params: { page, page_size: 20 } },
      )
    ).data,
  record: async (id: string, body: PassageInput) =>
    (
      await apiClient.post<ApiResponse<Passage>>(
        "/admin/checkpoints/passages",
        body,
        { headers: { "X-Checkpoint": id } },
      )
    ).data,
  operators: async (siteId?: string | null) =>
    (
      await apiClient.get<ApiResponse<CheckpointOperatorAssignments>>(
        "/admin/checkpoints/operators",
        { params: siteId ? { site_id: siteId } : {} },
      )
    ).data,
  assignOperator: async (gateId: string, siteAdminId: string) =>
    (
      await apiClient.put<ApiResponse<CheckpointOperatorAssignment>>(
        `/admin/checkpoints/${gateId}/operator`,
        { site_admin_id: siteAdminId },
      )
    ).data,
  event: async (id: string) =>
    (
      await apiClient.get<ApiResponse<Passage>>(
        `/admin/checkpoints/events/${id}`,
      )
    ).data,
  accessEvents: async (params: AccessEventFilters = {}) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Passage>>>(
        "/admin/access-events",
        { params },
      )
    ).data,
  accessEvent: async (id: string) =>
    (await apiClient.get<ApiResponse<Passage>>(`/admin/access-events/${id}`))
      .data,
  presence: async (params: { place_id?: string; gate_id?: string } = {}) =>
    (
      await apiClient.get<
        ApiResponse<{ items: AccessPresence[]; total: number }>
      >("/admin/access-events/presence", { params })
    ).data,
  movements: async (placeId: string) =>
    (
      await apiClient.get<ApiResponse<CheckpointMovement[]>>(
        "/admin/checkpoint-policy/movements",
        { params: { place_id: placeId } },
      )
    ).data,
  createMovement: async (body: {
    place_id: string;
    source_gate_id: string;
    target_gate_id: string;
    direction: "entry" | "exit";
    route_group?: string;
    description?: string;
  }) =>
    (
      await apiClient.post<ApiResponse<CheckpointMovement>>(
        "/admin/checkpoint-policy/movements",
        body,
      )
    ).data,
  deleteMovement: async (movementId: string) =>
    (
      await apiClient.delete<ApiResponse<unknown>>(
        `/admin/checkpoint-policy/movements/${movementId}`,
      )
    ).data,
};
