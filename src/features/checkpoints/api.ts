import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
export interface Gate {
  id: string;
  name: string;
}
export interface Passage {
  id: string;
  gate_id: string;
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
        `/admin/checkpoints/${id}/passages`,
        body,
      )
    ).data,
  event: async (id: string) =>
    (
      await apiClient.get<ApiResponse<Passage>>(
        `/admin/checkpoints/events/${id}`,
      )
    ).data,
};
