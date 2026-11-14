import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { UseCase } from "@/features/context/api";
import type { Place } from "@/features/places/api";

/** One Site in the organization portfolio directory. */
export interface OrganizationSiteSummary {
    id: string;
    organization_id: string;
    parent_site_id: string | null;
    parent_site_name: string | null;
    name: string;
    slug: string;
    use_case: UseCase;
    description: string | null;
    address: string;
    timezone: string;
    is_active: boolean;
    place_count: number;
    child_site_count: number;
    created_at: string;
    updated_at: string;
}

export interface OrganizationSiteNotificationSettings {
    maintenance_updates: boolean;
    resident_announcements: boolean;
    emergency_alerts: boolean;
    visitor_arrivals: boolean;
    weekly_operations_summary: boolean;
}

/** Site payload returned by the organization portfolio endpoints. */
export interface OrganizationSite {
    id: string;
    organization_id: string;
    parent_site_id: string | null;
    name: string;
    slug: string;
    use_case: UseCase;
    description: string | null;
    address: string;
    timezone: string;
    is_active: boolean;
    notification_settings: OrganizationSiteNotificationSettings;
    created_at: string;
    updated_at: string;
}

export interface OrganizationSiteDetail extends OrganizationSite {
    ancestors: OrganizationSite[];
    child_sites: OrganizationSite[];
    places: Place[];
}

export interface OrganizationSiteTreeNode extends OrganizationSite {
    children: OrganizationSiteTreeNode[];
}

export interface CreateOrganizationSiteInput {
    name: string;
    use_case: UseCase;
    parent_site_id?: string | null;
    address?: string;
    timezone?: string;
    description?: string | null;
    admin_user_id?: string | null;
    admin_email?: string;
    admin_name?: string | null;
    admin_phone?: string | null;
}

export type UpdateOrganizationSiteInput = Partial<
    Pick<
        OrganizationSite,
        "name" | "use_case" | "description" | "address" | "timezone"
    >
> & {
    notification_settings?: OrganizationSiteNotificationSettings;
};

/** Created Site payload returned by `POST /organizations/{slug}/sites`. */
export interface CreatedOrganizationSite extends OrganizationSite {
    site_admin: {
        assignment_id: string;
        user: {
            id: string;
            email: string;
            first_name: string | null;
            last_name: string | null;
        };
    } | null;
    onboarding_email: "queued" | "not_required";
    user_created: boolean;
}

const base = (slug: string) => `/organizations/${slug}/sites`;

export type OrganizationImportModel = "sites" | "places" | "units" | "parties";

export interface OrganizationImportRowResult {
    row: number;
    name: string;
    success: boolean;
    id?: string;
    slug?: string;
    kind?: string;
    site_id?: string;
    assignment_id?: string;
    email?: string;
    role?: string;
    place_id?: string;
    error?: string;
}

export interface OrganizationImportResult {
    total: number;
    successful: number;
    failed: number;
    results: OrganizationImportRowResult[];
}

export interface OrganizationManager {
    assignment_id: string;
    site: OrganizationSite;
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
        is_active: boolean;
    };
    role: "site_admin";
    status: string;
    roles: Array<{
        id: string;
        name: string;
        code: string;
        permissions: string[];
    }>;
    effective_permissions: string[];
}

export interface OrganizationManagersResult {
    managers: OrganizationManager[];
    total: number;
}

export interface OrganizationSiteRole {
    id: string;
    name: string;
    code: string;
    permissions: string[];
}

export interface AddOrganizationManagerInput {
    site_id: string;
    display_name?: string | null;
    email: string;
    phone?: string | null;
    role_ids?: string[];
}

export const organizationWorkspaceApi = {
    /** Organization-owned portfolio directory. */
    sites: async (slug: string) => {
        const response = await apiClient.get<ApiResponse<OrganizationSiteSummary[]>>(
            base(slug),
        );
        return response.data;
    },

    /** Organization-owned Site hierarchy. */
    tree: async (slug: string, includeInactive = false) => {
        const response = await apiClient.get<ApiResponse<OrganizationSiteTreeNode[]>>(
            `${base(slug)}/tree`,
            { params: { include_inactive: includeInactive } },
        );
        return response.data;
    },

    /** One Site in the organization portfolio with its Places and children. */
    site: async (slug: string, siteId: string) => {
        const response = await apiClient.get<ApiResponse<OrganizationSiteDetail>>(
            `${base(slug)}/${siteId}`,
        );
        return response.data;
    },

    /** Provision a Site (with its first Site administrator) in the portfolio. */
    createSite: async (slug: string, body: CreateOrganizationSiteInput) => {
        const response = await apiClient.post<ApiResponse<CreatedOrganizationSite>>(
            base(slug),
            body,
        );
        return response.data;
    },

    updateSite: async (
        slug: string,
        siteId: string,
        body: UpdateOrganizationSiteInput,
    ) => {
        const response = await apiClient.patch<ApiResponse<OrganizationSite>>(
            `${base(slug)}/${siteId}`,
            body,
        );
        return response.data;
    },

    moveSite: async (slug: string, siteId: string, parentSiteId: string | null) => {
        const response = await apiClient.post<ApiResponse<OrganizationSite>>(
            `${base(slug)}/${siteId}/move`,
            { parent_site_id: parentSiteId },
        );
        return response.data;
    },

    setSiteActive: async (slug: string, siteId: string, active: boolean) => {
        const response = await apiClient.post<ApiResponse<OrganizationSite>>(
            `${base(slug)}/${siteId}/${active ? "activate" : "archive"}`,
        );
        return response.data;
    },

    /** Site managers across the organization, optionally for one Site. */
    managers: async (slug: string, siteId?: string | null) => {
        const response = await apiClient.get<ApiResponse<OrganizationManagersResult>>(
            `/organizations/${slug}/managers`,
            { params: siteId ? { site_id: siteId } : undefined },
        );
        return response.data;
    },

    addManager: async (slug: string, body: AddOrganizationManagerInput) => {
        const response = await apiClient.post<ApiResponse<OrganizationManager>>(
            `/organizations/${slug}/managers`,
            body,
        );
        return response.data;
    },

    replaceManagerRoles: async (
        slug: string,
        assignmentId: string,
        roleIds: string[],
    ) => {
        const response = await apiClient.patch<
            ApiResponse<{
                assignment_id: string;
                roles: OrganizationSiteRole[];
                effective_permissions: string[];
            }>
        >(`/organizations/${slug}/managers/${assignmentId}/roles`, {
            role_ids: roleIds,
        });
        return response.data;
    },

    removeManager: async (slug: string, assignmentId: string) => {
        const response = await apiClient.delete<
            ApiResponse<{
                assignment_id: string;
                source: "manager";
                status: string;
            }>
        >(`/organizations/${slug}/managers/${assignmentId}`);
        return response.data;
    },

    siteRoles: async (slug: string) => {
        const response = await apiClient.get<ApiResponse<OrganizationSiteRole[]>>(
            `/organizations/${slug}/site-roles`,
        );
        return response.data;
    },

    /** Import Sites, places or units from a CSV file. */
    importModels: async (
        slug: string,
        model: OrganizationImportModel,
        file: File,
    ) => {
        const form = new FormData();
        form.append("file", file);
        const response = await apiClient.post<ApiResponse<OrganizationImportResult>>(
            `/organizations/${slug}/imports/${model}`,
            form,
            { headers: { "Content-Type": "multipart/form-data" } },
        );
        return response.data;
    },

    /** Import places, units or parties into a Site the caller manages. */
    importSiteModels: async (
        siteId: string,
        model: OrganizationImportModel,
        file: File,
    ) => {
        const form = new FormData();
        form.append("file", file);
        const response = await apiClient.post<ApiResponse<OrganizationImportResult>>(
            `/admin/sites/${siteId}/imports/${model}`,
            form,
            { headers: { "Content-Type": "multipart/form-data" } },
        );
        return response.data;
    },
};

