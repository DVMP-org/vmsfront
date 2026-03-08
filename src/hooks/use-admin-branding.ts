import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
import {
    clearCachedBrandingTheme,
    getCachedBrandingTheme,
    setCachedBrandingTheme,
} from "../lib/branding-utils";
import { getSubdomain } from "@/lib/subdomain-utils";
import {
    BrandingTheme,
    CreateBrandingThemeRequest,
    UpdateBrandingThemeRequest,
} from "@/types";
import { toast } from "sonner";

export function useBrandingThemes() {
    return useQuery<BrandingTheme[]>({
        queryKey: ["admin", "branding", "themes"],
        queryFn: async () => {
            const response = await adminService.getBrandingThemes();
            return response.data;
        },
    });
}

export function useActiveBrandingTheme() {
    const orgSlug = getSubdomain();
    const hasOrganizationHeader = !!orgSlug;

    return useQuery<BrandingTheme>({
        queryKey: ["admin", "branding", "theme", "active"],
        queryFn: async () => {
            const response = await adminService.getActiveBrandingTheme();
            const theme = response.data;
            setCachedBrandingTheme(theme, { hasOrganizationHeader, orgSlug });
            return theme;
        },
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: true,
        initialData: () => getCachedBrandingTheme({ orgSlug, fallbackToGlobal: true }) ?? undefined,
    });
}

export function useCreateBrandingTheme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateBrandingThemeRequest) =>
            adminService.createBrandingTheme(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "branding"] });
            toast.success("Branding theme created successfully!");
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.detail || "Failed to create branding theme"
            );
        },
    });
}

export function useUpdateBrandingTheme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            themeId,
            data,
        }: {
            themeId: string;
            data: UpdateBrandingThemeRequest;
        }) => adminService.updateBrandingTheme(themeId, data),
        onSuccess: async (response) => {
            // If the updated theme is active, update cache
            if (response.data?.active) {
                setCachedBrandingTheme(response.data, {
                    hasOrganizationHeader: !!getSubdomain(),
                    orgSlug: getSubdomain(),
                });
            }
            queryClient.invalidateQueries({ queryKey: ["admin", "branding"] });
            toast.success("Branding theme updated successfully!");
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.detail || "Failed to update branding theme"
            );
        },
    });
}

export function useDeleteBrandingTheme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (themeId: string) =>
            adminService.deleteBrandingTheme(themeId),
        onSuccess: (_, deletedThemeId) => {
            // If the deleted theme was cached, clear it
            const orgSlug = getSubdomain();
            const cached = getCachedBrandingTheme({ orgSlug, fallbackToGlobal: false });
            if (cached?.id === deletedThemeId) {
                clearCachedBrandingTheme({
                    hasOrganizationHeader: !!orgSlug,
                    orgSlug,
                });
            }
            queryClient.invalidateQueries({ queryKey: ["admin", "branding"] });
            toast.success("Branding theme deleted successfully!");
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.detail || "Failed to delete branding theme"
            );
        },
    });
}

export function useActivateBrandingTheme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (themeId: string) =>
            adminService.activateBrandingTheme(themeId),
        onSuccess: async (response) => {
            // Cache the newly activated theme
            if (response.data) {
                setCachedBrandingTheme(response.data, {
                    hasOrganizationHeader: !!getSubdomain(),
                    orgSlug: getSubdomain(),
                });
            }
            queryClient.invalidateQueries({ queryKey: ["admin", "branding"] });
            toast.success("Branding theme activated successfully!");
            // Reload page to apply theme changes
            setTimeout(() => {
                window.location.reload();
            }, 500);
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.detail || "Failed to activate branding theme"
            );
        },
    });
}

