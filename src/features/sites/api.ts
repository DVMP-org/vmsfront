import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Property, PropertyInput } from "@/features/properties/api";
import type { UseCase } from "@/features/context/api";

export interface SiteNotificationSettings {
  maintenance_updates: boolean;
  resident_announcements: boolean;
  emergency_alerts: boolean;
  visitor_arrivals: boolean;
  weekly_operations_summary: boolean;
}

export interface Site {
  id: string;
  organization_id: string;
  parent_site_id: string | null;
  name: string;
  slug: string;
  use_case: UseCase | null;
  description: string | null;
  address: string;
  is_active: boolean;
  notification_settings: SiteNotificationSettings;
  created_at: string;
  updated_at: string;
}

export interface SiteDetail extends Site {
  ancestors: Site[];
  child_sites: Site[];
  places: Property[];
}

export interface SiteInput {
  name: string;
  admin_email: string;
  admin_name?: string | null;
  admin_phone?: string | null;
  use_case: UseCase;
  parent_site_id?: string | null;
  description?: string | null;
  address?: string;
}

export interface SiteCreated extends Site {
  site_admin: import("@/features/managers/api").SiteManager;
  onboarding_email: "queued" | "not_required";
  user_created: boolean;
}

export interface SitePlaceInput extends Omit<
  PropertyInput,
  "site_id" | "parent_id"
> {
  parent_id?: string | null;
}

const base = "/admin/sites";

export const sitesApi = {
  list: async (params: {
    page: number;
    page_size: number;
    search?: string;
    parent_site_id?: string;
    root_only?: boolean;
    is_active?: boolean;
  }) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Site>>>(base, {
        params,
      })
    ).data,
  get: async (id: string) =>
    (await apiClient.get<ApiResponse<SiteDetail>>(`${base}/${id}`)).data,
  create: async (body: SiteInput) =>
    (await apiClient.post<ApiResponse<SiteCreated>>(base, body)).data,
  update: async (
    id: string,
    body: Partial<Pick<SiteInput, "name" | "description" | "address">> & {
      notification_settings?: SiteNotificationSettings;
    },
  ) => (await apiClient.patch<ApiResponse<Site>>(`${base}/${id}`, body)).data,
  move: async (id: string, parent_site_id: string | null) =>
    (
      await apiClient.post<ApiResponse<Site>>(`${base}/${id}/move`, {
        parent_site_id,
      })
    ).data,
  toggle: async (id: string, active: boolean) =>
    (
      await apiClient.post<ApiResponse<Site>>(
        `${base}/${id}/${active ? "activate" : "archive"}`,
      )
    ).data,
  createPlace: async (siteId: string, body: SitePlaceInput) =>
    (
      await apiClient.post<ApiResponse<Property>>(
        `${base}/${siteId}/places`,
        body,
      )
    ).data,
};
