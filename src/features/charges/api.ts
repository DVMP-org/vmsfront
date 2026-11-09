import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export interface Definition {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  amount: string;
  currency: string;
  recurrence: string;
  start_date?: string | null;
  is_active: boolean;
  created_by_site_admin_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Assignment {
  id: string;
  charge_definition_id: string;
  charge_definition: Definition;
  target_site_id?: string;
  target_place: { id: string; name: string };
  current_responsibility: {
    id: string;
    created_by_site_admin_id?: string | null;
    responsible_party: {
      id?: string;
      kind?: string;
      display_name: string;
      email?: string | null;
    };
  } | null;
  outstanding_amount: string;
  status?: string;
  effective_from?: string | null;
  created_by_site_admin_id?: string | null;
}

export interface Schedule {
  id: string;
  due_date: string;
  amount: string;
  balance: string;
  currency: string;
  status: string;
  current_responsibility?: {
    id: string;
    responsible_party: { display_name: string };
  };
}

const base = "/admin/charges";
const get = async <T>(path: string, params?: object) =>
  (await apiClient.get<ApiResponse<T>>(base + path, { params })).data;
const post = async <T>(path: string, body: object) =>
  (await apiClient.post<ApiResponse<T>>(base + path, body)).data;

export const chargesApi = {
  definitions: (page: number, siteId?: string | null) =>
    get<PaginatedResponse<Definition>>("/definitions", {
      page,
      page_size: 20,
      ...(siteId ? { site_id: siteId } : {}),
    }),
  definition: (id: string) => get<Definition>(`/definitions/${id}`),
  create: (body: object) => post<Definition>("/definitions", body),
  update: async (id: string, body: object) =>
    (
      await apiClient.patch<ApiResponse<Definition>>(
        `${base}/definitions/${id}`,
        body,
      )
    ).data,
  assignments: (id: string, page = 1) =>
    get<PaginatedResponse<Assignment>>("/assignments", {
      charge_definition_id: id,
      page,
      page_size: 20,
    }),
  assignment: (id: string) => get<Assignment>(`/assignments/${id}`),
  allAssignments: async (page = 1, pageSize = 100) =>
    get<PaginatedResponse<Assignment>>("/assignments", {
      page,
      page_size: pageSize,
    }),
  assign: (body: object) => post<Assignment>("/assignments", body),
  schedules: (id: string, page = 1) =>
    get<PaginatedResponse<Schedule>>("/schedules", {
      assignment_id: id,
      page,
      page_size: 20,
    }),
  generate: (id: string, body: object) =>
    post<Schedule[]>(`/assignments/${id}/schedules`, body),
  transfer: (id: string, body: object) =>
    post(`/assignments/${id}/transfer`, body),
};
