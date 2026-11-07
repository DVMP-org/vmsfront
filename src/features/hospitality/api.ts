import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
import { Stay } from "./contracts";
const base = "/admin/hospitality/stays";
export const hospitalityApi = {
  list: async (page: number, status: string) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Stay>>>(base, {
        params: { page, page_size: 10, ...(status ? { status } : {}) },
      })
    ).data,
  get: async (id: string) =>
    (await apiClient.get<ApiResponse<Stay>>(`${base}/${id}`)).data,
  create: async (body: unknown) =>
    (await apiClient.post<ApiResponse<Stay>>(base, body)).data,
  update: async (id: string, body: unknown) =>
    (await apiClient.patch<ApiResponse<Stay>>(`${base}/${id}`, body)).data,
  action: async (id: string, action: string, body?: unknown) =>
    (await apiClient.post<ApiResponse<Stay>>(`${base}/${id}/${action}`, body))
      .data,
};
