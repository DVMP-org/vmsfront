import { apiClient } from "@/lib/api-client";
import {
  ApiResponse,
  Organization,
  OrganizationMembership,
  CreateOrganizationRequest,
} from "@/types";

export const organizationService = {
  /**
   * Get all organizations the current user belongs to
   */
  async getMyOrganizations(): Promise<ApiResponse<Organization[]>> {
    return apiClient.get("/organizations/me");
  },

  /**
   * Get a specific organization by slug
   */
  async getOrganization(slug: string): Promise<ApiResponse<Organization>> {
    return apiClient.get(`/organizations/${slug}`);
  },

  /**
   * Create a new organization
   */
  async createOrganization(
    data: CreateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    return apiClient.post("/organizations", data);
  },

  /**
   * Update an organization
   */
  async updateOrganization(
    slug: string,
    data: Partial<CreateOrganizationRequest>
  ): Promise<ApiResponse<Organization>> {
    return apiClient.patch(`/organizations/${slug}`, data);
  },

  /**
   * Check if a slug is available
   */
  async checkSlugAvailability(
    slug: string
  ): Promise<ApiResponse<{ available: boolean }>> {
    return apiClient.get(`/organizations/check-slug/${slug}`);
  },
};
