import { queryClient } from "@/lib/query-client";
import { notificationChannelService } from "@/services/notification-channel-service";
import {
    NotificationProvider,
    ChannelProviderSummary,
    ActivateProviderRequest,
    UpdateProviderCredentialsRequest,
} from "@/types/notification-channel";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const PROVIDERS_KEY = "notification-providers";
const CHANNEL_SUMMARIES_KEY = "notification-channel-summaries";

/** Fetch all providers with org-specific activation status */
export function useNotificationProviders(limit?: number) {
    return useQuery<NotificationProvider[]>({
        queryKey: [PROVIDERS_KEY, limit],
        queryFn: async () => {
            const response = await notificationChannelService.getProviders({ limit });
            return response.data;
        },
    });
}

/** Fetch per-channel summary of active providers */
export function useChannelProviderSummaries() {
    return useQuery<ChannelProviderSummary[]>({
        queryKey: [CHANNEL_SUMMARIES_KEY],
        queryFn: async () => {
            const response = await notificationChannelService.getChannelSummaries();
            return response.data;
        },
    });
}

/** Fetch a single provider by ID */
export function useNotificationProvider(providerId: string | null) {
    return useQuery<NotificationProvider>({
        queryKey: [PROVIDERS_KEY, providerId],
        queryFn: async () => {
            if (!providerId) throw new Error("Provider ID is required");
            const response = await notificationChannelService.getProvider(providerId);
            return response.data;
        },
        enabled: !!providerId,
    });
}

/** Activate a provider for a channel (deactivates any existing one) */
export function useActivateProvider() {
    return useMutation({
        mutationFn: async (data: ActivateProviderRequest) => {
            return notificationChannelService.activateProvider(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PROVIDERS_KEY] });
            queryClient.invalidateQueries({ queryKey: [CHANNEL_SUMMARIES_KEY] });
            toast.success("Notification provider activated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to activate provider");
        },
    });
}

/** Deactivate a notification provider */
export function useDeactivateProvider() {
    return useMutation({
        mutationFn: async (providerId: string) => {
            return notificationChannelService.deactivateProvider(providerId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PROVIDERS_KEY] });
            queryClient.invalidateQueries({ queryKey: [CHANNEL_SUMMARIES_KEY] });
            toast.success("Notification provider deactivated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to deactivate provider");
        },
    });
}

/** Update credentials for an activated provider */
export function useUpdateProviderCredentials() {
    return useMutation({
        mutationFn: async ({
            providerId,
            data,
        }: {
            providerId: string;
            data: UpdateProviderCredentialsRequest;
        }) => {
            return notificationChannelService.updateCredentials(providerId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PROVIDERS_KEY] });
            toast.success("Provider credentials updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update provider credentials");
        },
    });
}
