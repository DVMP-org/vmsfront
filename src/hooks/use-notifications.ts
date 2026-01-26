"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generalService } from "@/services/general-service";
import { useAuthStore } from "@/store/auth-store";
import { NotificationResponse, PaginatedResponse } from "@/types";



export function useNotifications(userId: string, params: {
    page: number;
    pageSize: number;
    search?: string;
    filters?: string;
    sort?: string;
}) {

    return useQuery<PaginatedResponse<NotificationResponse>>({
        queryKey: ["notifications", userId, params],
        queryFn: async () => {
            const response = await generalService.getNotifications(userId, params);
            return response.data;
        },
        enabled: !!userId,
        refetchInterval: 30000, // Refetch every 30 seconds
    });




}


export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationIds: string[]) => generalService.markAsRead(notificationIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}