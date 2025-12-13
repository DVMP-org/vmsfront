import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
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

const ACTIVE_THEME_STORAGE_KEY = "active-branding-theme";

function getCachedTheme(): BrandingTheme | null {
    if (typeof window === "undefined") return null;
    try {
        const cached = localStorage.getItem(ACTIVE_THEME_STORAGE_KEY);
        if (cached) {
            return JSON.parse(cached) as BrandingTheme;
        }
    } catch (error) {
        console.error("Failed to parse cached theme:", error);
    }
    return null;
}

function setCachedTheme(theme: BrandingTheme | null): void {
    if (typeof window === "undefined") return;
    try {
        if (theme) {
            localStorage.setItem(ACTIVE_THEME_STORAGE_KEY, JSON.stringify(theme));
        } else {
            localStorage.removeItem(ACTIVE_THEME_STORAGE_KEY);
        }
    } catch (error) {
        console.error("Failed to cache theme:", error);
    }
}

export function useActiveBrandingTheme() {
    return useQuery<BrandingTheme>({
        queryKey: ["admin", "branding", "theme", "active"],
        queryFn: async () => {
            const response = await adminService.getActiveBrandingTheme();
            const theme = response.data;
            // Cache the theme in localStorage
            setCachedTheme(theme);
            return theme;
        },
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: true,
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
                setCachedTheme(response.data);
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
            const cached = getCachedTheme();
            if (cached?.id === deletedThemeId) {
                setCachedTheme(null);
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
                setCachedTheme(response.data);
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

