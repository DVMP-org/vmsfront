import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
export interface Gate {
  id: string;
  name: string;
  place_id?: string | null;
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
  party: {
    id: string;
    kind: string;
    display_name: string;
    email: string | null;
    is_active: boolean;
  };
  assigned_by_party_id?: string | null;
  assigned_at: string;
  is_active: boolean;
}
export interface CheckpointOperatorAssignments {
  place_id?: string | null;
  assignments: CheckpointOperatorAssignment[];
}
export interface Passage {
  id: string;
  gate_id: string;
  lane_id?: string | null;
  direction: "entry" | "exit";
  outcome: string;
  reason_code: string;
  occurred_at: string;
  replayed?: boolean;
}
export interface PassageInput {
  authorization_code: string;
  guest_suffix?: string;
  direction: "entry" | "exit";
  lane_id?: string;
  idempotency_key: string;
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
  operators: async (placeId?: string | null) =>
    (
      await apiClient.get<ApiResponse<CheckpointOperatorAssignments>>(
        "/admin/checkpoints/operators",
        { params: placeId ? { place_id: placeId } : {} },
      )
    ).data,
  assignOperator: async (gateId: string, partyId: string) =>
    (
      await apiClient.put<ApiResponse<CheckpointOperatorAssignment>>(
        `/admin/checkpoints/${gateId}/operator`,
        { party_id: partyId },
      )
    ).data,
  event: async (id: string) =>
    (
      await apiClient.get<ApiResponse<Passage>>(
        `/admin/checkpoints/events/${id}`,
      )
    ).data,
};
