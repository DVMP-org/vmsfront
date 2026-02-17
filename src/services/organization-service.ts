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
    try {
      return apiClient.get("/organizations/me");
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      throw error;
    }
  },

  /**
   * Get a specific organization by slug
   */
  async getOrganization(slug: string): Promise<ApiResponse<Organization>> {
    try {
      return apiClient.get(`/organizations/${slug}`);
    } catch (error) {
      console.error(`Failed to fetch organization ${slug}:`, error);
      throw error;
    }
  },

  /**
   * Create a new organization
   */
  async createOrganization(
    data: CreateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    try {
      return apiClient.post("/organizations/create", data);
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  },

  /**
   * Update an organization
   */
  async updateOrganization(
    slug: string,
    data: Partial<CreateOrganizationRequest>
  ): Promise<ApiResponse<Organization>> {
    try {
      return apiClient.patch(`/organizations/${slug}`, data);
    } catch (error) {
      console.error(`Failed to update organization ${slug}:`, error);
      throw error;
    }
  },

  /**
   * Check if a slug is available
   */
  async checkSlugAvailability(
    slug: string
  ): Promise<ApiResponse<{ exists: boolean }>> {
    try {
      return apiClient.get(`/organizations/check-slug/${slug}`);
    } catch (error) {
      console.error(`Failed to check slug availability for ${slug}:`, error);
      throw error;
    }
  },
};
