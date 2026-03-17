import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types";
import {
    NotificationProvider,
    ActivateProviderRequest,
    UpdateProviderCredentialsRequest,
    ChannelProviderSummary,
} from "@/types/notification-channel";

export const notificationChannelService = {
    /**
     * List all notification providers with org-specific activation status.
     */
    async getProviders(params?: {
        limit?: number;
    }): Promise<ApiResponse<NotificationProvider[]>> {
        return apiClient.get("/admin/notification-providers", {
            params: {
                limit: params?.limit || undefined,
            },
        });
    },

    /**
     * Per-channel summary: which provider is active for each channel.
     */
    async getChannelSummaries(): Promise<ApiResponse<ChannelProviderSummary[]>> {
        return apiClient.get("/admin/notification-providers/channels");
    },

    /** Get full detail for a single notification provider */
    async getProvider(
        providerId: string
    ): Promise<ApiResponse<NotificationProvider>> {
        return apiClient.get(`/admin/notification-providers/${providerId}`);
    },

    /**
     * Activate a provider for a channel (deactivates any existing one).
     */
    async activateProvider(
        data: ActivateProviderRequest
    ): Promise<ApiResponse<NotificationProvider>> {
        return apiClient.post("/admin/notification-providers/activate", data);
    },

    /**
     * Deactivate a notification provider for the current organization.
     */
    async deactivateProvider(
        providerId: string
    ): Promise<ApiResponse<NotificationProvider>> {
        return apiClient.post(
            `/admin/notification-providers/${providerId}/deactivate`
        );
    },

    /**
     * Update credentials for an activated notification provider.
     */
    async updateCredentials(
        providerId: string,
        data: UpdateProviderCredentialsRequest
    ): Promise<ApiResponse<NotificationProvider>> {
        return apiClient.put(
            `/admin/notification-providers/${providerId}/credentials`,
            data
        );
    },
};
