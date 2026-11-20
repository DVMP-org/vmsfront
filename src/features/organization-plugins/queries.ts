"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { sitesApi } from "@/features/sites/api";
import { adminService } from "@/services/admin-service";
import { integrationService } from "@/services/integration-service";
import type { PaginatedResponse } from "@/types";
import type {
    BackendPlugin,
    MarketplaceCategory,
    MarketplacePlugin,
    PluginConfig,
    PluginHealth,
    PluginSiteState,
    SitePluginList,
} from "@/types/plugin";

export interface OrganizationIntegrationSummary {
    id: string;
    name: string;
    provider: string;
    description: string | null;
    capabilities: string[];
    enabled: boolean;
    configured: boolean;
}

export const pluginKeys = {
    all: (organizationId: string) =>
        ["organization", organizationId, "plugins"] as const,
    installed: (organizationId: string) =>
        [...pluginKeys.all(organizationId), "installed"] as const,
    catalog: (
        organizationId: string,
        params: { page: number; search: string; category: string },
    ) => [...pluginKeys.all(organizationId), "catalog", params] as const,
    detail: (organizationId: string, pluginId: string) =>
        [...pluginKeys.all(organizationId), "detail", pluginId] as const,
    sites: (organizationId: string, pluginId: string) =>
        [...pluginKeys.all(organizationId), "sites", pluginId] as const,
    integrations: (organizationId: string) =>
        ["organization", organizationId, "integrations"] as const,
};

export function useInstalledPlugins(organizationId: string, enabled: boolean) {
    return useQuery<BackendPlugin[]>({
        queryKey: pluginKeys.installed(organizationId),
        queryFn: async () => (await adminService.getPlugins()).data,
        enabled,
    });
}

export function usePluginCatalog(
    organizationId: string,
    params: { page: number; pageSize: number; search: string; category: string },
    enabled: boolean,
) {
    const filters = params.category
        ? formatFiltersForAPI([
            { field: "category", operator: "eq", value: params.category },
        ])
        : undefined;

    return useQuery<PaginatedResponse<MarketplacePlugin>>({
        queryKey: pluginKeys.catalog(organizationId, params),
        queryFn: async () =>
            (
                await adminService.getMarketplacePlugins({
                    page: params.page,
                    pageSize: params.pageSize,
                    search: params.search || undefined,
                    filters,
                })
            ).data,
        enabled,
    });
}

export function useMarketplaceCategories(enabled: boolean) {
    return useQuery<MarketplaceCategory[]>({
        queryKey: ["marketplace", "categories"],
        queryFn: async () => (await adminService.getMarketplaceCategories()).data,
        enabled,
        staleTime: 10 * 60 * 1000,
    });
}

export function usePluginDetail(
    organizationId: string,
    pluginId: string | null,
) {
    return useQuery<BackendPlugin>({
        queryKey: pluginKeys.detail(organizationId, pluginId ?? "none"),
        queryFn: async () => (await adminService.getPluginSettings(pluginId!)).data,
        enabled: Boolean(pluginId),
        refetchOnWindowFocus: false,
    });
}

export function usePluginSites(
    organizationId: string,
    pluginId: string | null,
) {
    return useQuery<PluginSiteState[]>({
        queryKey: pluginKeys.sites(organizationId, pluginId ?? "none"),
        queryFn: async () => (await adminService.getPluginSites(pluginId!)).data,
        enabled: Boolean(pluginId),
    });
}

export function usePluginHealthCheck(pluginId: string | null) {
    return useMutation<PluginHealth, unknown, void>({
        mutationFn: async () => {
            if (!pluginId) throw new Error("No plugin selected");
            return (await adminService.getPluginHealth(pluginId)).data;
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function usePluginDeploymentActions(
    organizationId: string,
    pluginId: string | null,
) {
    const queryClient = useQueryClient();
    const invalidate = () => {
        if (!pluginId) return;
        queryClient.invalidateQueries({
            queryKey: pluginKeys.sites(organizationId, pluginId),
        });
        queryClient.invalidateQueries({
            queryKey: pluginKeys.detail(organizationId, pluginId),
        });
    };

    const activate = useMutation({
        mutationFn: async ({
            siteIds,
            bindings,
        }: {
            siteIds: string[];
            bindings: Record<string, string>;
        }) => {
            if (!pluginId) throw new Error("No plugin selected");
            return (
                await adminService.activatePluginForSites(pluginId, siteIds, {
                    bindings,
                })
            ).data;
        },
        onSuccess: (results) => {
            const activated = results.filter((entry) => entry.state === "active");
            const pending = results.filter(
                (entry) => entry.state && entry.state !== "active",
            );
            const failed = results.filter((entry) => entry.error);
            if (activated.length) {
                toast.success(
                    `Activated for ${activated.length} Site${activated.length === 1 ? "" : "s"}`,
                );
            }
            if (pending.length) {
                toast.warning(
                    `Saved for ${pending.length} Site${pending.length === 1 ? "" : "s"} without a provider binding`,
                );
            }
            if (failed.length) {
                toast.error(
                    `${failed.length} Site${failed.length === 1 ? "" : "s"} could not be activated: ${failed[0].error}`,
                );
            }
        },
        onError: (error) => toast.error(parseApiError(error).message),
        onSettled: invalidate,
    });

    const suspend = useMutation({
        mutationFn: async (siteId: string) => {
            if (!pluginId) throw new Error("No plugin selected");
            return (await adminService.suspendPluginForSite(pluginId, siteId))
                .data;
        },
        onSuccess: (state) =>
            toast.success(`Suspended for ${state.site_name ?? "Site"}`),
        onError: (error) => toast.error(parseApiError(error).message),
        onSettled: invalidate,
    });

    return { activate, suspend };
}

export function useOrganizationSites(organizationId: string, enabled: boolean) {
    return useQuery({
        queryKey: ["organization", organizationId, "sites", "picker"],
        queryFn: async () => {
            const response = await sitesApi.list({ page: 1, page_size: 100 });
            return response.items ?? [];
        },
        enabled,
    });
}

export function useSitePlugins(siteId: string | null) {
    return useQuery<SitePluginList>({
        queryKey: ["site", siteId ?? "none", "plugins"],
        queryFn: async () => (await adminService.getSitePlugins(siteId!)).data,
        enabled: Boolean(siteId),
    });
}

export function useSiteActivationActions(siteId: string | null) {
    const queryClient = useQueryClient();
    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey: ["site", siteId ?? "none", "plugins"],
        });

    const activate = useMutation({
        mutationFn: async ({
            pluginId,
            bindings,
        }: {
            pluginId: string;
            bindings: Record<string, string>;
        }) => {
            if (!siteId) throw new Error("No Site selected");
            return (
                await adminService.activateSitePlugin(siteId, pluginId, {
                    bindings,
                })
            ).data;
        },
        onSuccess: (state) =>
            toast.success(
                state.state === "active"
                    ? "Activated for this Site"
                    : "Saved — bind a provider to finish activation",
            ),
        onError: (error) => toast.error(parseApiError(error).message),
        onSettled: invalidate,
    });

    const suspend = useMutation({
        mutationFn: async (pluginId: string) => {
            if (!siteId) throw new Error("No Site selected");
            return (await adminService.suspendSitePlugin(siteId, pluginId)).data;
        },
        onSuccess: () => toast.success("Suspended for this Site"),
        onError: (error) => toast.error(parseApiError(error).message),
        onSettled: invalidate,
    });

    return { activate, suspend };
}

export function useOrganizationIntegrations(
    organizationId: string,
    enabled: boolean,
) {
    return useQuery<OrganizationIntegrationSummary[]>({
        queryKey: pluginKeys.integrations(organizationId),
        queryFn: async () => {
            const response = await integrationService.getIntegrations({
                page: 1,
                pageSize: 100,
            });
            // A plugin binding references the organization's connection row, not
            // the catalog entry: only organizations that set one up can bind it.
            return response.data.items.flatMap((integration) => {
                const connectionId = integration.organization_integration_id;
                if (!connectionId) return [];
                return [
                    {
                        id: connectionId,
                        name: integration.name,
                        provider: String(integration.provider),
                        description: integration.description ?? null,
                        capabilities: (integration.capabilities ?? []) as string[],
                        enabled: integration.enabled,
                        configured: integration.configured,
                    },
                ];
            });
        },
        enabled,
    });
}

export function usePluginAction(organizationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            pluginId,
            action,
        }: {
            pluginId: string;
            action: "install" | "toggle";
        }) =>
            action === "install"
                ? adminService.installPlugin(pluginId)
                : adminService.togglePlugin(pluginId),
        onSuccess: (_response, { action }) => {
            toast.success(
                action === "install"
                    ? "Plugin installed"
                    : "Plugin availability updated",
            );
        },
        onError: (error) => toast.error(parseApiError(error).message),
        onSettled: () =>
            queryClient.invalidateQueries({
                queryKey: pluginKeys.all(organizationId),
            }),
    });
}

export function useConfigurePlugin(
    organizationId: string,
    pluginId: string | null,
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values: PluginConfig) => {
            if (!pluginId) throw new Error("No plugin selected");
            return adminService.updatePluginSettings(pluginId, values);
        },
        onSuccess: () => {
            toast.success("Plugin settings saved");
        },
        onError: (error) => toast.error(parseApiError(error).message),
        onSettled: () => {
            if (!pluginId) return;
            queryClient.invalidateQueries({
                queryKey: pluginKeys.detail(organizationId, pluginId),
            });
            queryClient.invalidateQueries({
                queryKey: pluginKeys.installed(organizationId),
            });
        },
    });
}
