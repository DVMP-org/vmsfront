"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";

import {
    organizationPoliciesApi,
    sitePoliciesApi,
    type PolicyTemplateInput,
    type PolicyTemplateUpdateInput,
    type PolicyValue,
} from "./api";

export const policyKeys = {
    site: (siteId: string) => ["policies", "site", siteId] as const,
    siteHistory: (siteId: string) =>
        ["policies", "site", siteId, "history"] as const,
    overview: (slug: string) => ["policies", "organization", slug] as const,
    catalog: (slug: string, useCase?: string | null) =>
        ["policies", "organization", slug, "catalog", useCase ?? "all"] as const,
    templates: (slug: string) =>
        ["policies", "organization", slug, "templates"] as const,
    assignments: (slug: string) =>
        ["policies", "organization", slug, "assignments"] as const,
    orgSite: (slug: string, siteId: string) =>
        ["policies", "organization", slug, "site", siteId] as const,
    audit: (slug: string, siteId?: string | null) =>
        ["policies", "organization", slug, "audit", siteId ?? "all"] as const,
};

export function useSitePolicies(siteId?: string | null) {
    return useQuery({
        queryKey: policyKeys.site(siteId ?? "none"),
        queryFn: () => sitePoliciesApi.catalog(siteId as string),
        enabled: Boolean(siteId),
        retry: false,
    });
}

export function useSitePolicyHistory(siteId?: string | null, enabled = false) {
    return useQuery({
        queryKey: policyKeys.siteHistory(siteId ?? "none"),
        queryFn: () => sitePoliciesApi.history(siteId as string),
        enabled: Boolean(siteId) && enabled,
        retry: false,
    });
}

export function useSetSitePolicy(siteId?: string | null) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: ({
            key,
            value,
            reason,
        }: {
            key: string;
            value: PolicyValue;
            reason?: string | null;
        }) => sitePoliciesApi.setOverride(siteId as string, key, value, reason),
        onSuccess: async () => {
            await Promise.all([
                client.invalidateQueries({ queryKey: policyKeys.site(siteId ?? "none") }),
                client.invalidateQueries({ queryKey: ["policies", "organization"] }),
            ]);
            toast.success("Policy updated for this site");
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useResetSitePolicy(siteId?: string | null) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (key: string) =>
            sitePoliciesApi.resetOverride(siteId as string, key),
        onSuccess: async () => {
            await Promise.all([
                client.invalidateQueries({ queryKey: policyKeys.site(siteId ?? "none") }),
                client.invalidateQueries({
                    queryKey: policyKeys.siteHistory(siteId ?? "none"),
                }),
                client.invalidateQueries({ queryKey: ["policies", "organization"] }),
            ]);
            toast.success("Inherited value restored");
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useOrganizationPolicies(slug?: string | null) {
    return useQuery({
        queryKey: policyKeys.overview(slug ?? "none"),
        queryFn: () => organizationPoliciesApi.overview(slug as string),
        enabled: Boolean(slug),
        retry: false,
    });
}

export function usePolicyCatalog(
    slug?: string | null,
    useCase?: string | null,
) {
    return useQuery({
        queryKey: policyKeys.catalog(slug ?? "none", useCase),
        queryFn: () => organizationPoliciesApi.catalog(slug as string, useCase),
        enabled: Boolean(slug),
        retry: false,
    });
}

export function usePolicyTemplates(slug?: string | null) {
    return useQuery({
        queryKey: policyKeys.templates(slug ?? "none"),
        queryFn: () => organizationPoliciesApi.templates(slug as string),
        enabled: Boolean(slug),
        retry: false,
    });
}

export function usePolicyAssignments(slug?: string | null) {
    return useQuery({
        queryKey: policyKeys.assignments(slug ?? "none"),
        queryFn: () => organizationPoliciesApi.assignments(slug as string),
        enabled: Boolean(slug),
        retry: false,
    });
}

export function useOrganizationSitePolicies(
    slug: string | null | undefined,
    siteId: string | null | undefined,
    enabled = true,
) {
    return useQuery({
        queryKey: policyKeys.orgSite(slug ?? "none", siteId ?? "none"),
        queryFn: () =>
            organizationPoliciesApi.siteCatalog(slug as string, siteId as string),
        enabled: Boolean(slug && siteId) && enabled,
        retry: false,
    });
}

function useInvalidateOrganizationSite(
    slug?: string | null,
    siteId?: string | null,
) {
    const client = useQueryClient();
    return async () => {
        await Promise.all([
            client.invalidateQueries({
                queryKey: policyKeys.orgSite(slug ?? "none", siteId ?? "none"),
            }),
            client.invalidateQueries({ queryKey: ["policies", "organization"] }),
            client.invalidateQueries({ queryKey: ["policies", "site"] }),
        ]);
    };
}

export function useSetOrganizationSitePolicy(
    slug?: string | null,
    siteId?: string | null,
) {
    const invalidate = useInvalidateOrganizationSite(slug, siteId);
    return useMutation({
        mutationFn: ({
            key,
            value,
            reason,
        }: {
            key: string;
            value: PolicyValue;
            reason?: string | null;
        }) =>
            organizationPoliciesApi.setSiteOverride(
                slug as string,
                siteId as string,
                key,
                value,
                reason,
            ),
        onSuccess: async () => {
            await invalidate();
            toast.success("Site policy override saved");
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useResetOrganizationSitePolicy(
    slug?: string | null,
    siteId?: string | null,
) {
    const invalidate = useInvalidateOrganizationSite(slug, siteId);
    return useMutation({
        mutationFn: (key: string) =>
            organizationPoliciesApi.resetSiteOverride(
                slug as string,
                siteId as string,
                key,
            ),
        onSuccess: async () => {
            await invalidate();
            toast.success("Inherited value restored");
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function usePolicyAudit(slug?: string | null, siteId?: string | null) {
    return useQuery({
        queryKey: policyKeys.audit(slug ?? "none", siteId),
        queryFn: () => organizationPoliciesApi.audit(slug as string, siteId),
        enabled: Boolean(slug),
        retry: false,
    });
}

function useInvalidateOrganizationPolicies(slug?: string | null) {
    const client = useQueryClient();
    return async () => {
        await Promise.all([
            client.invalidateQueries({ queryKey: ["policies", "organization"] }),
            client.invalidateQueries({ queryKey: ["policies", "site"] }),
        ]);
    };
}

export function useCreatePolicyTemplate(slug?: string | null) {
    const invalidate = useInvalidateOrganizationPolicies(slug);
    return useMutation({
        mutationFn: (input: PolicyTemplateInput) =>
            organizationPoliciesApi.createTemplate(slug as string, input),
        onSuccess: async (template) => {
            await invalidate();
            toast.success(`${template.name} created`);
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useUpdatePolicyTemplate(slug?: string | null) {
    const invalidate = useInvalidateOrganizationPolicies(slug);
    return useMutation({
        mutationFn: ({
            templateId,
            input,
        }: {
            templateId: string;
            input: PolicyTemplateUpdateInput;
        }) =>
            organizationPoliciesApi.updateTemplate(
                slug as string,
                templateId,
                input,
            ),
        onSuccess: async (template) => {
            await invalidate();
            toast.success(`${template.name} updated`);
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useDeletePolicyTemplate(slug?: string | null) {
    const invalidate = useInvalidateOrganizationPolicies(slug);
    return useMutation({
        mutationFn: (templateId: string) =>
            organizationPoliciesApi.deleteTemplate(slug as string, templateId),
        onSuccess: async () => {
            await invalidate();
            toast.success("Policy template deleted");
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useAssignPolicyTemplate(slug?: string | null) {
    const invalidate = useInvalidateOrganizationPolicies(slug);
    return useMutation({
        mutationFn: (input: {
            template_id: string;
            site_ids: string[];
            preview: boolean;
            reason?: string | null;
        }) => organizationPoliciesApi.assignTemplate(slug as string, input),
        onSuccess: async (result) => {
            await invalidate();
            if (!result.applies_immediately) return;
            toast.success(
                `Applied ${result.template_name} to ${result.sites.length} site${result.sites.length === 1 ? "" : "s"
                }`,
            );
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useRemovePolicyAssignment(slug?: string | null) {
    const invalidate = useInvalidateOrganizationPolicies(slug);
    return useMutation({
        mutationFn: (siteId: string) =>
            organizationPoliciesApi.removeAssignment(slug as string, siteId),
        onSuccess: async () => {
            await invalidate();
            toast.success("Site returned to platform defaults");
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}
