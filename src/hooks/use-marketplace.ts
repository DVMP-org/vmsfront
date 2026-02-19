import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { adminService } from "@/services/admin-service";
import { MarketplacePlugin, MarketplaceCategory } from "@/types/plugin";
import { PaginatedResponse } from "@/types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";

// Get all marketplace plugins with pagination and filters
export function useMarketplacePlugins(params: {
    page: number;
    pageSize: number;
    search?: string;
    filters?: string;
    sort?: string;
}) {
    return useQuery<PaginatedResponse<MarketplacePlugin>>({
        queryKey: ["marketplace", "plugins", params],
        queryFn: async () => {
            const response = await adminService.getMarketplacePlugins(params);
            return response.data;
        },
    });
}

// Get single marketplace plugin details
export function useMarketplacePlugin(pluginId: string | null) {
    return useQuery<MarketplacePlugin>({
        queryKey: ["marketplace", "plugin", pluginId],
        queryFn: async () => {
            if (!pluginId) throw new Error("Plugin ID is required");
            const response = await adminService.getMarketplacePlugin(pluginId);
            return response.data;
        },
        enabled: !!pluginId,
    });
}

// Get marketplace categories for filtering
export function useMarketplaceCategories() {
    return useQuery<MarketplaceCategory[]>({
        queryKey: ["marketplace", "categories"],
        queryFn: async () => {
            const response = await adminService.getMarketplaceCategories();
            return response.data;
        },
        staleTime: 10 * 60 * 1000, // Categories don't change often
    });
}

// Install a plugin from marketplace
export function useInstallPlugin() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (pluginId: string) => adminService.installPlugin(pluginId),
        onSuccess: (response, pluginId) => {
            // Invalidate both marketplace and admin plugins queries
            queryClient.invalidateQueries({ queryKey: ["marketplace", "plugins"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "plugins"] });

            toast.success(response.data.message || "Plugin installed successfully!");

            // Redirect to admin plugins page with pluginId to open modal
            router.push(`/admin/plugins?pluginId=${pluginId}`);
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

// Uninstall a plugin
export function useUninstallPlugin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (pluginId: string) => adminService.uninstallPlugin(pluginId),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["marketplace", "plugins"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "plugins"] });

            toast.success(response.data.message || "Plugin uninstalled successfully!");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

// Prefetch a single plugin for hover/preview states
export function usePrefetchMarketplacePlugin() {
    const queryClient = useQueryClient();

    return (pluginId: string) => {
        if (!pluginId) return;
        queryClient.prefetchQuery({
            queryKey: ["marketplace", "plugin", pluginId],
            queryFn: async () => {
                const response = await adminService.getMarketplacePlugin(pluginId);
                return response.data;
            },
            staleTime: 5 * 60 * 1000,
        });
    };
}
