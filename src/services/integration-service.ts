import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
  Integration,
  IntegrationCredentials,
  UpdateIntegrationRequest,
} from "@/types/integration";

export const integrationService = {
  // List all integrations
  async getIntegrations(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    filters?: string;
    sort?: string;
  }): Promise<ApiResponse<PaginatedResponse<Integration>>> {

    return apiClient.get(`/admin/integrations`, {
      params: {
        search: params?.search || undefined,
        filters: params?.filters || undefined,
        sort: params?.sort || undefined,
        page: params?.page || undefined,
        page_size: params?.pageSize || undefined,
      },
    });
  },

  // Get single integration by ID
  async getIntegrationById(integrationId: string): Promise<ApiResponse<Integration>> {
    return apiClient.get(`/admin/integrations/${integrationId}`);
  },

  // Update integration (credentials/config)
  async updateIntegrationCredentials(
    integrationId: string,
    credentials: IntegrationCredentials
  ): Promise<ApiResponse<Integration>> {
    return apiClient.put(`/admin/integrations/${integrationId}/credentials`, {
      credentials,
    });
  },

  // Enable integration
  async enableIntegration(name: string): Promise<ApiResponse<Integration>> {
    return apiClient.post(`/admin/integrations/${name}/enable`);
  },

  // Disable integration
  async disableIntegration(name: string): Promise<ApiResponse<Integration>> {
    return apiClient.post(`/admin/integrations/${name}/disable`);
  },

  // Health check
  async checkHealth(name: string): Promise<ApiResponse<{ status: string; message?: string }>> {
    return apiClient.get(`/admin/integrations/${name}/health`);
  },
};
