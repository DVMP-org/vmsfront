import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type PolicyValueType =
    | "boolean"
    | "integer"
    | "decimal"
    | "threshold"
    | "enum"
    | "time_window";

export type PolicySource =
    | "platform_guardrail"
    | "platform_default"
    | "domain_default"
    | "organization_template"
    | "site_override";

export type PolicyValue =
    | boolean
    | number
    | string
    | string[]
    | { start: string; end: string; days?: number[] };

export interface PolicyOption {
    value: PolicyValue;
    label: string;
    description?: string;
}

export interface PolicyEntry {
    key: string;
    name: string;
    description: string;
    category: "site" | "domain" | "module" | string;
    owner: string;
    module: string | null;
    domains: string[];
    value_type: PolicyValueType;
    default: PolicyValue;
    group: string;
    group_label: string;
    options: PolicyOption[];
    minimum: string | null;
    maximum: string | null;
    unit: string | null;
    site_overridable: boolean;
    template_configurable: boolean;
    guardrail: boolean;
    enforcement: string;
    permissions: string[];
    definition_version: number;
    deprecated: boolean;
    replaced_by: string | null;
    effective_value: PolicyValue;
    source: PolicySource;
    site_override_value: PolicyValue | null;
    has_site_override: boolean;
    template_value: PolicyValue | null;
    template_id: string | null;
    template_name: string | null;
    editable: boolean;
}

export interface PolicyGroup {
    key: string;
    label: string;
    policies: PolicyEntry[];
}

export interface SitePolicyCatalog {
    site_id: string;
    use_case: string;
    modules: string[];
    template: { id: string; name: string; version: number } | null;
    groups: PolicyGroup[];
    policies: PolicyEntry[];
}

export interface ResolvedPolicy {
    key: string;
    value: PolicyValue;
    source: PolicySource;
    definition_version: number;
    module: string | null;
    template_id: string | null;
}

export type PolicyDefinitionEntry = Omit<
    PolicyEntry,
    | "effective_value"
    | "source"
    | "site_override_value"
    | "has_site_override"
    | "template_value"
    | "template_id"
    | "template_name"
    | "editable"
>;

export interface PolicyDefinitionCatalog {
    use_case: string | null;
    groups: Array<{
        key: string;
        label: string;
        policies: PolicyDefinitionEntry[];
    }>;
}

export interface PolicyTemplate {
    id: string;
    name: string;
    description: string | null;
    use_cases: string[];
    version: number;
    values: Record<string, PolicyValue>;
    assigned_site_ids: string[];
}

export interface PolicyAuditEvent {
    id: string;
    policy_key: string;
    policy_name: string;
    site_id: string | null;
    template_id: string | null;
    previous_value: PolicyValue | null;
    new_value: PolicyValue | null;
    source: PolicySource | "site_assignment";
    actor_user_id: string | null;
    reason: string | null;
    definition_version: number;
    created_at: string;
}

export interface PolicyOverview {
    available_policies: number;
    site_count: number;
    template_count: number;
    sites_with_template: number;
    sites_without_template: number;
    sites_with_overrides: number;
    templates: PolicyTemplate[];
    recent_changes: PolicyAuditEvent[];
}

export interface PolicySiteAssignment {
    site_id: string;
    site_name: string;
    use_case: string;
    is_active: boolean;
    template_id: string | null;
    template_name: string | null;
    override_count: number;
}

export interface PolicyValueChange {
    key: string;
    name: string;
    previous_value: PolicyValue | null;
    new_value: PolicyValue;
    previous_source: PolicySource | null;
}

export interface PolicyAssignmentPreview {
    template_id: string;
    template_name: string;
    template_version: number;
    sites: Array<{
        site_id: string;
        site_name: string;
        use_case: string;
        changed_values: PolicyValueChange[];
        site_override_keys: string[];
    }>;
    conflicts: Array<{ site_id: string; reasons: string[] }>;
    applies_immediately: boolean;
}

export interface PolicyTemplateInput {
    name: string;
    description?: string | null;
    use_cases: string[];
    values: Record<string, PolicyValue>;
}

export type PolicyTemplateUpdateInput = Partial<PolicyTemplateInput>;

const siteBase = (siteId: string) => `/admin/sites/${siteId}/policies`;
const orgBase = (slug: string) => `/organizations/${slug}`;

export const sitePoliciesApi = {
    catalog: async (siteId: string) =>
        (await apiClient.get<ApiResponse<SitePolicyCatalog>>(siteBase(siteId)))
            .data,

    history: async (siteId: string) =>
        (
            await apiClient.get<ApiResponse<PolicyAuditEvent[]>>(
                `${siteBase(siteId)}/history`,
            )
        ).data,

    setOverride: async (
        siteId: string,
        key: string,
        value: PolicyValue,
        reason?: string | null,
    ) =>
        (
            await apiClient.put<ApiResponse<ResolvedPolicy>>(
                `${siteBase(siteId)}/${encodeURIComponent(key)}`,
                { value, reason: reason ?? null },
            )
        ).data,

    resetOverride: async (siteId: string, key: string) =>
        (
            await apiClient.delete<ApiResponse<ResolvedPolicy>>(
                `${siteBase(siteId)}/${encodeURIComponent(key)}`,
            )
        ).data,
};

export const organizationPoliciesApi = {
    overview: async (slug: string) =>
        (
            await apiClient.get<ApiResponse<PolicyOverview>>(
                `${orgBase(slug)}/policies`,
            )
        ).data,

    catalog: async (slug: string, useCase?: string | null) =>
        (
            await apiClient.get<ApiResponse<PolicyDefinitionCatalog>>(
                `${orgBase(slug)}/policy-catalog`,
                { params: useCase ? { use_case: useCase } : undefined },
            )
        ).data,

    templates: async (slug: string) =>
        (
            await apiClient.get<ApiResponse<PolicyTemplate[]>>(
                `${orgBase(slug)}/policy-templates`,
            )
        ).data,

    createTemplate: async (slug: string, body: PolicyTemplateInput) =>
        (
            await apiClient.post<ApiResponse<PolicyTemplate>>(
                `${orgBase(slug)}/policy-templates`,
                body,
            )
        ).data,

    updateTemplate: async (
        slug: string,
        templateId: string,
        body: PolicyTemplateUpdateInput,
    ) =>
        (
            await apiClient.patch<ApiResponse<PolicyTemplate>>(
                `${orgBase(slug)}/policy-templates/${templateId}`,
                body,
            )
        ).data,

    deleteTemplate: async (slug: string, templateId: string) => {
        await apiClient.delete(
            `${orgBase(slug)}/policy-templates/${templateId}`,
        );
    },

    siteCatalog: async (slug: string, siteId: string) =>
        (
            await apiClient.get<ApiResponse<SitePolicyCatalog>>(
                `${orgBase(slug)}/sites/${siteId}/policies`,
            )
        ).data,

    setSiteOverride: async (
        slug: string,
        siteId: string,
        key: string,
        value: PolicyValue,
        reason?: string | null,
    ) =>
        (
            await apiClient.put<ApiResponse<ResolvedPolicy>>(
                `${orgBase(slug)}/sites/${siteId}/policies/${encodeURIComponent(key)}`,
                { value, reason: reason ?? null },
            )
        ).data,

    resetSiteOverride: async (slug: string, siteId: string, key: string) =>
        (
            await apiClient.delete<ApiResponse<ResolvedPolicy>>(
                `${orgBase(slug)}/sites/${siteId}/policies/${encodeURIComponent(key)}`,
            )
        ).data,

    siteAudit: async (slug: string, siteId: string) =>
        (
            await apiClient.get<ApiResponse<PolicyAuditEvent[]>>(
                `${orgBase(slug)}/sites/${siteId}/policies/history`,
            )
        ).data,

    assignments: async (slug: string) =>
        (
            await apiClient.get<ApiResponse<PolicySiteAssignment[]>>(
                `${orgBase(slug)}/policy-assignments`,
            )
        ).data,

    assignTemplate: async (
        slug: string,
        body: {
            template_id: string;
            site_ids: string[];
            preview: boolean;
            reason?: string | null;
        },
    ) =>
        (
            await apiClient.post<ApiResponse<PolicyAssignmentPreview>>(
                `${orgBase(slug)}/policy-assignments`,
                body,
            )
        ).data,

    removeAssignment: async (slug: string, siteId: string) => {
        await apiClient.delete(`${orgBase(slug)}/policy-assignments/${siteId}`);
    },

    audit: async (slug: string, siteId?: string | null) =>
        (
            await apiClient.get<ApiResponse<PolicyAuditEvent[]>>(
                `${orgBase(slug)}/policies/audit`,
                { params: siteId ? { site_id: siteId } : undefined },
            )
        ).data,
};
