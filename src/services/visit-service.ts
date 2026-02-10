import { apiClient } from "@/lib/api-client";
import { ApiResponse, ApproveVisitResponse, CreateGatePassData, CreateVisitRequest, VisitResidency, VisitResident, VisitResponse } from "@/types";


export const visitService = {
  /**
   * Get list of residencies available for visit requests
   */
  async getResidenciesForVisit(): Promise<ApiResponse<VisitResidency[]>> {
    return apiClient.get("/visits/residencies");
  },

  /**
   * Get list of residents for a specific residency
   */
  async getResidentsForResidency(
    residencyId: string
  ): Promise<ApiResponse<VisitResident[]>> {
    return apiClient.get(`/visits/residents/${residencyId}`);
  },

  /**
   * Create a new visit request
   */
  async createVisitRequest(
    data: CreateVisitRequest
  ): Promise<ApiResponse<VisitResponse>> {
    return apiClient.post("/visits/create", data);
  },

  /**
   * Get visit request details
   */
  async getVisitRequest(
    visitRequestId: string
  ): Promise<ApiResponse<VisitResponse>> {
    return apiClient.get(`/visits/request/${visitRequestId}`);
  },


};
