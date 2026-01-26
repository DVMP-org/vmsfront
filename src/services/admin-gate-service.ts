import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
import { Gate, CreateGateRequest, UpdateGateRequest, GateNode } from "@/types/gate";

export const adminGateService = {
    async getGates(params: {
        page: number;
        pageSize: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<Gate>>> {
        return apiClient.get("/admin/gates", {
            params: {
                page: params.page ?? 1,
                page_size: params.pageSize ?? 10,
                search: params.search ?? undefined,
                filters: params.filters ?? undefined,
                sort: params.sort || "-created_at",
            },
        });
    },

    async getGate(gateId: string): Promise<ApiResponse<Gate>> {
        return apiClient.get(`/admin/gate/${gateId}`);
    },

    async createGate(data: CreateGateRequest): Promise<ApiResponse<Gate>> {
        return apiClient.post("/admin/gate/create", data);
    },

    async updateGate(gateId: string, data: UpdateGateRequest): Promise<ApiResponse<Gate>> {
        return apiClient.put(`/admin/gate/${gateId}`, data);
    },

    async deleteGate(gateId: string): Promise<ApiResponse<void>> {
        return apiClient.delete(`/admin/gate/${gateId}`);
    },


    async toggleGateAdminStatus(gateId: string, gateAdminIds: string[]): Promise<ApiResponse<void>> {
        return apiClient.post(`/admin/gate/admin/${gateId}/toggle`, gateAdminIds);
    },

    async getGateDependencyMap(): Promise<ApiResponse<GateNode[]>> {
        return apiClient.get("/admin/gate/dependency/map");
    },
};
