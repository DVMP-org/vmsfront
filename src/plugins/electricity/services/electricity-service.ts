import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
    Disco,
    ElectricityPlace,
  ElectricityPurchase,
    ElectricityStats,
  Meter,
  MeterCreate,
    MeterUpdate,
  PurchaseQuote,
  PurchaseQuoteCreate,
    PurchaseToken,
    PurchaseTokenCreate,
} from "../types";

export const electricityService = {
    /** Distribution companies a meter can be registered against. */
    async getDiscos(): Promise<ApiResponse<Disco[]>> {
        return apiClient.get("/electricity/discos");
    },

    /** Units in the active Site that can carry a meter. */
    async getPlaces(params?: {
        search?: string;
    }): Promise<ApiResponse<ElectricityPlace[]>> {
        return apiClient.get("/electricity/places", {
            params: { search: params?.search || undefined },
        });
    },

  // Get all meters (paginated)
  async getMeters(params?: {
    page?: number;
    pageSize?: number;
      placeId?: string;
  }): Promise<ApiResponse<PaginatedResponse<Meter>>> {
    return apiClient.get("/electricity/meters", {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 10,
            place_id: params?.placeId || undefined,
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

    /** Change the meter's unit, identity, name or active state. */
    async updateMeter(
        meterId: string,
        data: MeterUpdate,
    ): Promise<ApiResponse<Meter>> {
        return apiClient.patch(`/electricity/meters/${meterId}`, data);
    },

    /** Remove a meter with no purchase history. */
    async deleteMeter(
        meterId: string,
    ): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
        return apiClient.delete(`/electricity/meters/${meterId}`);
    },

  /** Price a purchase and report which tenders the policy allows. */
  async getPurchaseQuote(
    data: PurchaseQuoteCreate,
  ): Promise<ApiResponse<PurchaseQuote>> {
    return apiClient.post("/electricity/purchase/quote", data);
  },

  /**
   * Buy electricity. A wallet purchase is queued for vending; a gateway
   * purchase returns a checkout payload. Neither confirms delivery.
   */
  async purchaseToken(
    data: PurchaseTokenCreate,
  ): Promise<ApiResponse<PurchaseToken>> {
    return apiClient.post("/electricity/purchase/token", data);
  },

  /** Requery an ambiguous purchase with the provider. */
  async reconcilePurchase(
    purchaseId: string,
  ): Promise<ApiResponse<{ status: string; reason?: string }>> {
    return apiClient.post(
      `/electricity/purchases/${encodeURIComponent(purchaseId)}/reconcile`,
      {},
    );
  },

  // Get paginated list of purchases
  async getPurchases(params?: {
    page?: number;
    pageSize?: number;
      placeId?: string;
  }): Promise<ApiResponse<PaginatedResponse<ElectricityPurchase>>> {
    return apiClient.get("/electricity/purchases", {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 10,
            place_id: params?.placeId || undefined,
      },
    });
  },

  // Get electricity statistics
  async getStats(): Promise<ApiResponse<ElectricityStats>> {
    return apiClient.get("/electricity/stats");
  },
};
