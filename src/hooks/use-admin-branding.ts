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

export function useActiveBrandingTheme() {
    return useQuery<BrandingTheme>({
        queryKey: ["admin", "branding", "theme", "active"],
        queryFn: async () => {
            const response = await adminService.getActiveBrandingTheme();
            return response.data;
        },
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
        onSuccess: () => {
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
        onSuccess: () => {
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
        onSuccess: () => {
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

