"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { useIntegrations } from "@/hooks/use-integrations";
import { useAdminProfile } from "@/hooks/use-admin";

import {
    organizationWorkspaceApi,
    type AddOrganizationManagerInput,
    type CreateOrganizationSiteInput,
    type OrganizationImportModel,
    type UpdateOrganizationSiteInput,
} from "./api";
import { buildActivityFeed, buildPortfolioMetrics } from "./lib";

export const organizationWorkspaceKeys = {
    sites: (slug: string) =>
        ["organization-workspace", slug, "sites"] as const,
    site: (slug: string, siteId: string) =>
        ["organization-workspace", slug, "sites", siteId] as const,
    tree: (slug: string) =>
        ["organization-workspace", slug, "sites", "tree"] as const,
    managers: (slug: string, siteId?: string | null) =>
        ["organization-workspace", slug, "managers", siteId ?? "all"] as const,
    siteRoles: (slug: string) =>
        ["organization-workspace", slug, "site-roles"] as const,
    overview: (slug: string) =>
        ["organization-workspace", slug, "overview"] as const,
};

export function useOrganizationSites(slug?: string | null) {
    return useQuery({
        queryKey: organizationWorkspaceKeys.sites(slug ?? "unknown"),
        queryFn: () => organizationWorkspaceApi.sites(slug as string),
        enabled: Boolean(slug),
        staleTime: 30_000,
    });
}

export function useOrganizationSite(slug?: string | null, siteId?: string | null) {
    return useQuery({
        queryKey: organizationWorkspaceKeys.site(
            slug ?? "unknown",
            siteId ?? "unknown",
        ),
        queryFn: () => organizationWorkspaceApi.site(slug as string, siteId as string),
        enabled: Boolean(slug && siteId),
        staleTime: 15_000,
    });
}

export function useCreateOrganizationSite(slug?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateOrganizationSiteInput) => {
            if (!slug) {
                throw new Error("Select an organization before creating a Site.");
            }
            return organizationWorkspaceApi.createSite(slug, input);
        },
        onSuccess: (site) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-workspace"],
            });
            queryClient.invalidateQueries({ queryKey: ["organization"] });
            queryClient.invalidateQueries({ queryKey: ["sites"] });
            if (slug) {
                queryClient.invalidateQueries({
                    queryKey: organizationWorkspaceKeys.sites(slug),
                });
            }
            toast.success(`${site.name} created`);
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useUpdateOrganizationSite(slug?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            siteId,
            input,
        }: {
            siteId: string;
            input: UpdateOrganizationSiteInput;
        }) => organizationWorkspaceApi.updateSite(slug as string, siteId, input),
        onSuccess: (site) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-workspace"],
            });
            if (slug) {
                queryClient.invalidateQueries({
                    queryKey: organizationWorkspaceKeys.site(slug, site.id),
                });
            }
            toast.success(`${site.name} updated`);
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useMoveOrganizationSite(slug?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            siteId,
            parentSiteId,
        }: {
            siteId: string;
            parentSiteId: string | null;
        }) => organizationWorkspaceApi.moveSite(slug as string, siteId, parentSiteId),
        onSuccess: (site) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-workspace"],
            });
            if (slug) {
                queryClient.invalidateQueries({
                    queryKey: organizationWorkspaceKeys.site(slug, site.id),
                });
            }
            toast.success(`${site.name} moved`);
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useOrganizationManagers(
    slug?: string | null,
    siteId?: string | null,
) {
    return useQuery({
        queryKey: organizationWorkspaceKeys.managers(slug ?? "unknown", siteId),
        queryFn: () => organizationWorkspaceApi.managers(slug as string, siteId),
        enabled: Boolean(slug),
        staleTime: 15_000,
    });
}

export function useOrganizationSiteRoles(slug?: string | null) {
    return useQuery({
        queryKey: organizationWorkspaceKeys.siteRoles(slug ?? "unknown"),
        queryFn: () => organizationWorkspaceApi.siteRoles(slug as string),
        enabled: Boolean(slug),
        staleTime: 60_000,
    });
}

export function useAddOrganizationManager(slug?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: AddOrganizationManagerInput) =>
            organizationWorkspaceApi.addManager(slug as string, input),
        onSuccess: (manager) => {
            queryClient.invalidateQueries({ queryKey: ["organization-workspace"] });
            toast.success(`${manager.user.name} assigned to ${manager.site.name}`);
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useReplaceOrganizationManagerRoles(slug?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            assignmentId,
            roleIds,
        }: {
            assignmentId: string;
            roleIds: string[];
        }) =>
            organizationWorkspaceApi.replaceManagerRoles(
                slug as string,
                assignmentId,
                roleIds,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organization-workspace"] });
            toast.success("Manager roles updated");
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useRemoveOrganizationManager(slug?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (assignmentId: string) =>
            organizationWorkspaceApi.removeManager(slug as string, assignmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organization-workspace"] });
            toast.success("Manager access removed");
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useImportOrganizationModels(slug?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            model,
            file,
        }: {
            model: OrganizationImportModel;
            file: File;
        }) => {
            if (!slug) {
                throw new Error("Select an organization before importing.");
            }
            return organizationWorkspaceApi.importModels(slug, model, file);
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["organization-workspace"] });
            queryClient.invalidateQueries({ queryKey: ["organization"] });
            queryClient.invalidateQueries({ queryKey: ["sites"] });
            queryClient.invalidateQueries({ queryKey: ["places"] });
            toast.success(
                `Imported ${result.successful} of ${result.total} row${result.total === 1 ? "" : "s"}`,
            );
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useImportSiteModels(siteId?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            model,
            file,
        }: {
            model: OrganizationImportModel;
            file: File;
        }) => {
            if (!siteId) {
                throw new Error("Select a Site before importing.");
            }
            return organizationWorkspaceApi.importSiteModels(siteId, model, file);
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["organization-workspace"] });
            queryClient.invalidateQueries({ queryKey: ["sites"] });
            queryClient.invalidateQueries({ queryKey: ["places"] });
            queryClient.invalidateQueries({ queryKey: ["site-configuration-site"] });
            queryClient.invalidateQueries({ queryKey: ["site-people"] });
            toast.success(
                `Imported ${result.successful} of ${result.total} row${result.total === 1 ? "" : "s"}`,
            );
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useSetOrganizationSiteActive(slug?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ siteId, active }: { siteId: string; active: boolean }) =>
            organizationWorkspaceApi.setSiteActive(slug as string, siteId, active),
        onSuccess: (site) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-workspace"],
            });
            if (slug) {
                queryClient.invalidateQueries({
                    queryKey: organizationWorkspaceKeys.site(slug, site.id),
                });
            }
            toast.success(site.is_active ? `${site.name} activated` : `${site.name} archived`);
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

/**
 * Composite read model for the organization home.
 *
 * The organization record owns membership; the portfolio endpoint owns Site
 * and Place counts; the integration catalog owns connection state. Keeping the
 * composition here means the home screen renders from one hook and never
 * assembles transport calls itself.
 */
export function useOrganizationOverview() {
    const current = useCurrentOrganization();
    const slug = current.organization?.slug ?? null;
    const profile = useAdminProfile();
    const canSeeIntegrations = hasAdminPermission(profile.data, [
        "admins.list",
        "organizations.show",
    ]);
    const sites = useOrganizationSites(slug);
    const integrations = useIntegrations(
        { page: 1, pageSize: 100 },
        { enabled: canSeeIntegrations },
    );

    const siteItems = useMemo(() => sites.data ?? [], [sites.data]);
    const integrationItems = useMemo(
        () => integrations.data?.items ?? [],
        [integrations.data?.items],
    );
    const admins = useMemo(
        () => current.organization?.admins ?? [],
        [current.organization?.admins],
    );

    const metrics = useMemo(
        () =>
            buildPortfolioMetrics({
                sites: siteItems,
                organization: current.organization,
                integrations: integrationItems,
            }),
        [current.organization, integrationItems, siteItems],
    );

    const activity = useMemo(
        () =>
            buildActivityFeed({
                sites: siteItems,
                admins,
                integrations: integrationItems,
                organizationSlug: slug,
            }),
        [admins, integrationItems, siteItems, slug],
    );

    return {
        ...current,
        slug,
        sites,
        integrations,
        profile,
        metrics,
        activity,
    };
}
