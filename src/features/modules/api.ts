import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { UseCase } from "@/features/context/api";

export type DomainModuleKey =
  | "properties"
  | "people"
  | "billing"
  | "access_control"
  | "maintenance"
  | "communication"
  | "documents"
  | "residential"
  | "commercial"
  | "hospitality"
  | "leases"
  | "reservations"
  | "housekeeping"
  | "shared_facilities"
  | "expense_allocation";

export interface PlaceModule {
  key: DomainModuleKey;
  label: string;
  description: string;
  enabled: boolean;
  supported: boolean;
  settings: Record<string, unknown>;
}

export interface PlaceModuleList {
  place_id: string;
  effective_use_case: UseCase;
  modules: PlaceModule[];
}

export interface PlaceModuleUpdate {
  key: DomainModuleKey;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export const placeModulesApi = {
  get: async (placeId: string) =>
    (
      await apiClient.get<ApiResponse<PlaceModuleList>>(
        `/admin/places/${placeId}/modules`,
      )
    ).data,
  update: async (placeId: string, modules: PlaceModuleUpdate[]) =>
    (
      await apiClient.patch<ApiResponse<PlaceModuleList>>(
        `/admin/places/${placeId}/modules`,
        { modules },
      )
    ).data,
};
