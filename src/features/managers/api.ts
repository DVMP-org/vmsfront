import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Site } from "@/features/sites/api";

export interface ManagerRole {
  id: string;
  name: string;
  code: string;
  permissions: string[];
}

export interface SiteManager {
  assignment_id: string;
  party: {
    id: string;
    kind: string;
    display_name: string;
    email: string | null;
    is_active: boolean;
  };
  role: "site_admin";
  status: string;
  roles: ManagerRole[];
  effective_permissions: string[];
}

export interface SiteManagers {
  site: Site;
  effective_use_case: string;
  managers: SiteManager[];
}

export interface SiteRole {
  id: string;
  name: string;
  code: string;
  description: string | null;
  permissions: string[];
}

export interface AddManagerInput {
  display_name: string;
  email: string;
  phone?: string;
  role_ids?: string[];
}

export const managersApi = {
  list: async (siteId: string) =>
    (
      await apiClient.get<ApiResponse<SiteManagers>>(
        `/admin/sites/${siteId}/managers`,
      )
    ).data,
  add: async (siteId: string, body: AddManagerInput) =>
    (
      await apiClient.post<
        ApiResponse<{
          assignment_id: string;
          onboarding_email: string;
          user_created: boolean;
          roles: ManagerRole[];
          effective_permissions: string[];
        }>
      >(`/admin/sites/${siteId}/managers`, body)
    ).data,
  replaceRoles: async (
    siteId: string,
    assignmentId: string,
    roleIds: string[],
  ) =>
    (
      await apiClient.patch<
        ApiResponse<{
          assignment_id: string;
          roles: ManagerRole[];
          effective_permissions: string[];
        }>
      >(`/admin/sites/${siteId}/managers/${assignmentId}/roles`, {
        role_ids: roleIds,
      })
    ).data,
  remove: async (siteId: string, assignmentId: string) =>
    (
      await apiClient.delete<
        ApiResponse<{
          assignment_id: string;
          source: "manager";
          status: string;
        }>
      >(`/admin/sites/${siteId}/people/manager/${assignmentId}`)
    ).data,
  roles: async (search = "") =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<SiteRole>>>(
        "/admin/site-roles",
        {
          params: { page: 1, page_size: 100, search: search || undefined },
        },
      )
    ).data,
};
