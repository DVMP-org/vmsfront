import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
  type GuestFolio,
  type HospitalityMaintenanceRequest,
  type HospitalityRoom,
  type HousekeepingStatus,
  type HousekeepingTask,
  type RoomAvailability,
  type RoomOperationalStatus,
  type Stay,
} from "./contracts";
const base = "/admin/hospitality/stays";
const moduleBase = "/admin/hospitality";
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
  rooms: {
    list: async (params?: { search?: string; status?: string }) =>
      (
        await apiClient.get<ApiResponse<HospitalityRoom[]>>(
          `${moduleBase}/rooms`,
          { params },
        )
      ).data,
    create: async (body: {
      name: string;
      room_number: string;
      room_type: string;
      floor?: string | null;
      capacity: number;
      base_rate: string;
      currency: string;
    }) =>
      (
        await apiClient.post<ApiResponse<HospitalityRoom>>(
          `${moduleBase}/rooms`,
          body,
        )
      ).data,
    update: async (
      id: string,
      body: Partial<{
        name: string;
        room_number: string;
        room_type: string;
        floor: string | null;
        capacity: number;
        base_rate: string;
        currency: string;
        status: RoomOperationalStatus;
      }>,
    ) =>
      (
        await apiClient.patch<ApiResponse<HospitalityRoom>>(
          `${moduleBase}/rooms/${id}`,
          body,
        )
      ).data,
    setStatus: async (id: string, status: RoomOperationalStatus) =>
      (
        await apiClient.post<ApiResponse<HospitalityRoom>>(
          `${moduleBase}/rooms/${id}/status`,
          { status },
        )
      ).data,
  },
  availability: async (from: string, to: string) =>
    (
      await apiClient.get<ApiResponse<RoomAvailability[]>>(
        `${moduleBase}/availability`,
        { params: { from, to } },
      )
    ).data,
  housekeeping: {
    list: async (status?: string) =>
      (
        await apiClient.get<ApiResponse<HousekeepingTask[]>>(
          `${moduleBase}/housekeeping`,
          { params: { status: status || undefined } },
        )
      ).data,
    update: async (
      id: string,
      body: Partial<{
        status: HousekeepingStatus;
        assigned_to: string | null;
        priority: "normal" | "high" | "urgent";
        notes: string | null;
      }>,
    ) =>
      (
        await apiClient.patch<ApiResponse<HousekeepingTask>>(
          `${moduleBase}/housekeeping/${id}`,
          body,
        )
      ).data,
  },
  folios: {
    get: async (stayId: string) =>
      (await apiClient.get<ApiResponse<GuestFolio>>(`${base}/${stayId}/folio`))
        .data,
    addLine: async (
      stayId: string,
      body: { description: string; amount: string; category: string },
    ) =>
      (
        await apiClient.post<ApiResponse<GuestFolio>>(
          `${base}/${stayId}/folio/lines`,
          body,
        )
      ).data,
    recordPayment: async (
      stayId: string,
      body: { amount: string; reference?: string },
    ) =>
      (
        await apiClient.post<ApiResponse<GuestFolio>>(
          `${base}/${stayId}/folio/payments`,
          body,
        )
      ).data,
  },
  maintenance: {
    list: async (status?: string) =>
      (
        await apiClient.get<ApiResponse<HospitalityMaintenanceRequest[]>>(
          `${moduleBase}/maintenance`,
          { params: { status: status || undefined } },
        )
      ).data,
    create: async (body: {
      room_id?: string | null;
      title: string;
      description: string;
      priority: string;
    }) =>
      (
        await apiClient.post<ApiResponse<HospitalityMaintenanceRequest>>(
          `${moduleBase}/maintenance`,
          body,
        )
      ).data,
    update: async (
      id: string,
      body: Partial<{
        status: string;
        priority: string;
        assigned_to: string | null;
      }>,
    ) =>
      (
        await apiClient.patch<ApiResponse<HospitalityMaintenanceRequest>>(
          `${moduleBase}/maintenance/${id}`,
          body,
        )
      ).data,
  },
};
