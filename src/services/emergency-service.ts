import { apiClient } from "@/lib/api-client";
import {
    ApiResponse,
    Emergency,
    PaginatedResponse,
    TriggerEmergencyRequest,
} from "@/types";

export const emergencyService = {
    // ── Shared ──────────────────────────────────────────────────────────────────

    /** Resident triggers a community emergency alert. */
    async triggerEmergencyResident(
        data: TriggerEmergencyRequest
    ): Promise<ApiResponse<Emergency>> {
        return apiClient.post("/resident/emergencies", data);
    },

    // ── Admin ────────────────────────────────────────────────────────────────────

    /** Admin triggers a community emergency alert. */
    async triggerEmergencyAdmin(
        data: TriggerEmergencyRequest
    ): Promise<ApiResponse<Emergency>> {
        return apiClient.post("/admin/emergencies", data);
    },

    /** Paginated list of all emergencies. */
    async getEmergencies(params?: {
        page?: number;
        pageSize?: number;
        status?: string;
        emergency_type?: string;
        severity?: string;
        search?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<Emergency>>> {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.pageSize) query.set("page_size", String(params.pageSize));
        if (params?.status) query.set("status", params.status);
        if (params?.emergency_type) query.set("emergency_type", params.emergency_type);
        if (params?.severity) query.set("severity", params.severity);
        if (params?.search) query.set("search", params.search);
        if (params?.sort) query.set("sort", params.sort);
        return apiClient.get(`/admin/emergencies?${query.toString()}`);
    },

    /** Fetch a single emergency. */
    async getEmergency(id: string): Promise<ApiResponse<Emergency>> {
        return apiClient.get(`/admin/emergencies/${id}`);
    },

    /** Acknowledge an active emergency. */
    async acknowledgeEmergency(id: string): Promise<ApiResponse<Emergency>> {
        return apiClient.patch(`/admin/emergencies/${id}/acknowledge`, {});
    },

    /** Resolve an emergency. */
    async resolveEmergency(id: string): Promise<ApiResponse<Emergency>> {
        return apiClient.patch(`/admin/emergencies/${id}/resolve`, {});
    },
};
