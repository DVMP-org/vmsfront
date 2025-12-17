import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
import { Meter, MeterCreate, PurchaseTokenCreate, PurchaseToken, ElectricityStats } from "../types";

export const electricityService = {
    // Get all meters (paginated)
    async getMeters(params?: {
        page?: number;
        pageSize?: number;
        house_id?: string;
    }): Promise<ApiResponse<PaginatedResponse<Meter>>> {
        return apiClient.get("/electricity/meters", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                house_id: params?.house_id ?? undefined,
            },
        });
    },

    // Create a new meter
    async createMeter(data: MeterCreate): Promise<ApiResponse<Meter>> {
        return apiClient.post("/electricity/meters", data);
    },

    // Get a single meter by ID
    async getMeter(meterId: string): Promise<ApiResponse<Meter>> {
        return apiClient.get(`/electricity/meters/${meterId}`);
    },

    // Purchase electricity token
    async purchaseToken(data: PurchaseTokenCreate): Promise<ApiResponse<PurchaseToken>> {
        return apiClient.post("/electricity/purchase/token", data);
    },

    // Get paginated list of purchases
    async getPurchases(params?: {
        page?: number;
        pageSize?: number;
        house_id?: string;
    }): Promise<ApiResponse<PaginatedResponse<PurchaseToken>>> {
        return apiClient.get("/electricity/purchases", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                house_id: params?.house_id ?? undefined,
            },
        });
    },

    // Get electricity statistics
    async getStats(): Promise<ApiResponse<ElectricityStats>> {
        return apiClient.get("/electricity/stats");
    },
};

