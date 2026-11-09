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

export interface SiteModule {
  key: DomainModuleKey;
  label: string;
  description: string;
  enabled: boolean;
  supported: boolean;
  settings: Record<string, unknown>;
}

export interface SiteModuleList {
  site_id: string;
  effective_use_case: UseCase;
  modules: SiteModule[];
}

export interface SiteModuleUpdate {
  key: DomainModuleKey;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export const siteModulesApi = {
  get: async (siteId: string) =>
    (
      await apiClient.get<ApiResponse<SiteModuleList>>(
        `/admin/sites/${siteId}/modules`,
      )
    ).data,
  update: async (siteId: string, modules: SiteModuleUpdate[]) =>
    (
      await apiClient.patch<ApiResponse<SiteModuleList>>(
        `/admin/sites/${siteId}/modules`,
        { modules },
      )
    ).data,
};
