import { apiClient } from "@/lib/api-client";
import { ApiResponse, House, NotificationResponse, Transaction, WalletTransaction, PaginatedResponse } from "@/types";



export const generalService = {
    async getAllHouses(): Promise<ApiResponse<House[]>> {
        return apiClient.get('/user/houses/list')
    },

    async getTransaction(reference: string): Promise<ApiResponse<Transaction>> {
        return apiClient.get(`/user/transactions/${reference}`);
    },

    async getNotifications(userId: string, params: {
        page: number;
        pageSize: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<NotificationResponse>>> {
        return apiClient.get(`/user/notifications`, {
            params: {
                page: params.page ?? 1,
                page_size: params.pageSize ?? 10,
                search: params.search ?? undefined,
                filters: params.filters ?? undefined,
                sort: params.sort || "-created_at",
            }
        });
    },

    async markAsRead(notificationIds: string[]): Promise<ApiResponse<{ success: boolean }>> {
        return apiClient.post(`/user/notifications/mark-as-read`, notificationIds);
    },
}

