import { apiClient } from "@/lib/api-client";
import { ApiResponse, Organization } from "@/types";

export type UseCase =
  "residential" | "commercial" | "mixed_use" | "hospitality";

export interface ModuleGroup {
  key: string;
  label: string;
  modules: string[];
}

export interface ContextCatalog {
  contract_version: "vmscore.context/v2";
  module_groups: ModuleGroup[];
  specialist_groups: { value: UseCase; label: string; modules: string[] }[];
  use_cases: {
    value: UseCase;
    label: string;
    modules: string[];
    module_groups: ModuleGroup[];
  }[];
  building_types: { value: string; label: string; kinds: string[] }[];
  common_modules: string[];
  structure_kinds: { value: string; label: string }[];
}

export interface WorkspaceContext {
  contract_version: "vmscore.context/v2";
  organization_id: string;
  organization_use_case: UseCase;
  effective_use_case: UseCase;
  site_id: string | null;
  place_id: string | null;
  context_scope: "organization" | "administration" | "membership";
  modules: string[];
  module_groups: ModuleGroup[];
  management?: {
    mode: "local" | "inherited" | "none";
    management_required: boolean;
    is_administrator: boolean;
    site_admin_id: string | null;
    selected_site: {
      id: string;
      name: string;
      slug: string;
      use_case: UseCase | null;
      parent_site_id: string | null;
    } | null;
    authoritative_site: {
      id: string;
      name: string;
      slug: string;
      use_case: UseCase | null;
      parent_site_id: string | null;
    } | null;
    administrators: Array<{
      party_id: string;
      display_name: string;
      email: string | null;
      role: string;
    }>;
  };
  roles?: Array<{
    id: string;
    name: string;
    code: string;
    permissions: string[];
  }>;
  effective_permissions?: string[];
}

export const contextApi = {
  catalog: async () =>
    (await apiClient.get<ApiResponse<ContextCatalog>>("/catalog/use-cases"))
      .data,
  workspace: async (siteId?: string | null) =>
    (
      await apiClient.get<ApiResponse<WorkspaceContext>>("/workspace/context", {
        params: siteId ? { site_id: siteId } : {},
      })
    ).data,
  organization: async () =>
    (await apiClient.get<ApiResponse<Organization>>("/admin/organization"))
      .data,
  updateOrganization: async (body: {
    name: string;
    description: string | null;
  }) =>
    (
      await apiClient.patch<ApiResponse<Organization>>(
        "/admin/organization",
        body,
      )
    ).data,
};
