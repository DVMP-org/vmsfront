import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
  type GuestDetail,
  type GuestFolio,
  type GuestOnboardingReceipt,
  type GuestSummary,
  type HospitalityMaintenanceRequest,
  type HospitalityRoom,
  type HousekeepingRoomDetail,
  type HousekeepingStatus,
  type HousekeepingTask,
  type RoomAvailability,
  type RoomOperationalStatus,
  type Stay,
} from "./contracts";
const base = "/admin/hospitality/stays";
const moduleBase = "/admin/hospitality";

/** The branding choices a hospitality Site's public booking page uses. */
export interface HospitalityPublicPage {
  site_id: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  primary_color: string;
  secondary_color: string;
  sections: string[];
  is_published: boolean;
  /** Inherited organization logo, shown when the Site has no logo. */
  logo_url: string | null;
}

/** One entry in the amenity vocabulary the server accepts. */
export interface AmenityOption {
  code: string;
  label: string;
  group: string;
  group_label: string;
}

export const hospitalityApi = {
  list: async (page: number, status: string) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Stay>>>(base, {
        params: { page, page_size: 10, ...(status ? { status } : {}) },
      })
    ).data,
  get: async (id: string) =>
    (await apiClient.get<ApiResponse<Stay>>(`${base}/${id}`)).data,
  guests: {
    list: async (params: {
      page: number;
      page_size: number;
      search?: string;
      status?: string;
    }) =>
      (
        await apiClient.get<ApiResponse<PaginatedResponse<GuestSummary>>>(
          `${moduleBase}/guests`,
          { params },
        )
      ).data,
    get: async (partyId: string) =>
      (
        await apiClient.get<ApiResponse<GuestDetail>>(
          `${moduleBase}/guests/${partyId}`,
        )
      ).data,
    resendOnboarding: async (partyId: string) =>
      (
        await apiClient.post<ApiResponse<GuestOnboardingReceipt>>(
          `${moduleBase}/guests/${partyId}/resend-onboarding`,
        )
      ).data,
  },
  create: async (body: unknown) =>
    (await apiClient.post<ApiResponse<Stay>>(base, body)).data,
  update: async (id: string, body: unknown) =>
    (await apiClient.patch<ApiResponse<Stay>>(`${base}/${id}`, body)).data,
  action: async (id: string, action: string, body?: unknown) =>
    (await apiClient.post<ApiResponse<Stay>>(`${base}/${id}/${action}`, body))
      .data,
  /**
   * The vocabulary a room's amenities are chosen from.
   *
   * Fetched rather than hard-coded, because the server validates writes against
   * exactly this list — a picker with its own copy would eventually offer
   * something the server refuses.
   */
  amenities: {
    list: async () =>
      (
        await apiClient.get<ApiResponse<AmenityOption[]>>(
          `${moduleBase}/amenities`,
        )
      ).data,
  },
  publicPage: {
    get: async () =>
      (
        await apiClient.get<ApiResponse<HospitalityPublicPage>>(
          `${moduleBase}/public-page`,
        )
      ).data,
    update: async (body: Partial<HospitalityPublicPage>) =>
      (
        await apiClient.put<ApiResponse<HospitalityPublicPage>>(
          `${moduleBase}/public-page`,
          body,
        )
      ).data,
  },
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
      place_group_id?: string | null;
      room_type?: string;
      floor?: string | null;
      capacity: number;
      base_rate: string;
      currency: string;
      amenities?: string[];
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
        place_group_id: string | null;
        room_type: string;
        floor: string | null;
        capacity: number;
        base_rate: string;
        currency: string;
        status: RoomOperationalStatus;
        amenities: string[];
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
    detail: async (roomId: string) =>
      (
        await apiClient.get<ApiResponse<HousekeepingRoomDetail>>(
          `${moduleBase}/housekeeping/${roomId}`,
        )
      ).data,
    update: async (
      id: string,
      body: Partial<{
        status: HousekeepingStatus;
        assigned_to: string | null;
        priority: "normal" | "high" | "urgent";
        notes: string | null;
        due_at: string | null;
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
