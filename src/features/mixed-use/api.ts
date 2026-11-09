import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export type FacilityType =
  | "amenity"
  | "conference_room"
  | "parking"
  | "pool"
  | "gym"
  | "coworking"
  | "garden"
  | "other";

export type AllocationUseCase =
  "residential" | "commercial" | "hospitality" | "shared";

export type AllocationStatus = "draft" | "approved" | "archived";

export interface SharedFacility {
  id: string;
  organization_id: string;
  place_id: string;
  name: string;
  facility_type: FacilityType;
  description: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedFacilityInput {
  name: string;
  facility_type: FacilityType;
  description?: string | null;
  capacity?: number | null;
}

export interface ExpenseAllocationShare {
  id: string;
  organization_id: string;
  allocation_id: string;
  target_place_id: string | null;
  use_case: AllocationUseCase;
  label: string;
  percentage: string;
  amount: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseAllocation {
  id: string;
  organization_id: string;
  place_id: string;
  title: string;
  description: string | null;
  period_start: string;
  period_end: string;
  total_amount: string;
  currency: string;
  status: AllocationStatus;
  shares: ExpenseAllocationShare[];
  created_at: string;
  updated_at: string;
}

export interface ExpenseAllocationInput {
  title: string;
  description?: string | null;
  period_start: string;
  period_end: string;
  total_amount: string;
  currency: string;
  shares: Array<{
    use_case: AllocationUseCase;
    label: string;
    target_place_id?: string | null;
    percentage: string;
  }>;
}

export const mixedUseApi = {
  listFacilities: async (
    placeId: string,
    params: {
      page?: number;
      page_size?: number;
      search?: string;
      active?: boolean;
    } = {},
  ) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<SharedFacility>>>(
        `/admin/places/${placeId}/shared-facilities`,
        { params },
      )
    ).data,
  createFacility: async (placeId: string, body: SharedFacilityInput) =>
    (
      await apiClient.post<ApiResponse<SharedFacility>>(
        `/admin/places/${placeId}/shared-facilities`,
        body,
      )
    ).data,
  updateFacility: async (
    placeId: string,
    facilityId: string,
    body: Partial<SharedFacilityInput> & { is_active?: boolean },
  ) =>
    (
      await apiClient.patch<ApiResponse<SharedFacility>>(
        `/admin/places/${placeId}/shared-facilities/${facilityId}`,
        body,
      )
    ).data,
  listAllocations: async (
    placeId: string,
    params: {
      page?: number;
      page_size?: number;
      search?: string;
      status?: string;
    } = {},
  ) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<ExpenseAllocation>>>(
        `/admin/places/${placeId}/expense-allocations`,
        { params },
      )
    ).data,
  createAllocation: async (placeId: string, body: ExpenseAllocationInput) =>
    (
      await apiClient.post<ApiResponse<ExpenseAllocation>>(
        `/admin/places/${placeId}/expense-allocations`,
        body,
      )
    ).data,
  approveAllocation: async (placeId: string, allocationId: string) =>
    (
      await apiClient.post<ApiResponse<ExpenseAllocation>>(
        `/admin/places/${placeId}/expense-allocations/${allocationId}/approve`,
      )
    ).data,
  archiveAllocation: async (placeId: string, allocationId: string) =>
    (
      await apiClient.post<ApiResponse<ExpenseAllocation>>(
        `/admin/places/${placeId}/expense-allocations/${allocationId}/archive`,
      )
    ).data,
};
