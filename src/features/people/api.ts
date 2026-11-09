import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface PlacePerson {
  assignment_id: string;
  party: {
    id: string;
    kind: string;
    display_name: string;
    email: string | null;
    is_active: boolean;
  };
  role: string;
  is_super_admin: boolean;
  status: string;
  place: {
    id: string;
    name: string;
    slug: string;
    kind: string;
    is_active: boolean;
    site_name?: string | null;
  };
}

export interface PlacePeople {
  site: {
    id: string;
    organization_id: string;
    parent_site_id: string | null;
    name: string;
    slug: string;
    use_case: string | null;
    description: string | null;
    address: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  effective_use_case: "residential" | "commercial" | "hospitality" | "mixed_use";
  people: PlacePerson[];
}

export interface AddPlacePersonInput {
  place_id: string;
  display_name: string;
  email: string;
  phone?: string;
  kind: "person";
  role?: string;
}

export interface AddPlacePersonResponse {
  assignment_id: string;
  role: string;
  is_super_admin: boolean;
  status: string;
  party: PlacePerson["party"] & { organization_id: string; user_id: string | null };
  place: PlacePerson["place"];
  onboarding_email: "queued" | "not_required";
  user_created: boolean;
}

export const peopleApi = {
  get: async (siteId: string) =>
    (
      await apiClient.get<ApiResponse<PlacePeople>>(
        `/admin/sites/${siteId}/people`,
      )
    ).data,
  add: async (siteId: string, body: AddPlacePersonInput) =>
    (
      await apiClient.post<ApiResponse<AddPlacePersonResponse>>(
        `/admin/sites/${siteId}/people`,
        body,
      )
    ).data,
  remove: async (
    siteId: string,
    source: "occupancy",
    assignmentId: string,
  ) =>
    (
      await apiClient.delete<
        ApiResponse<{
          assignment_id: string;
          source: "occupancy";
          status: string;
        }>
      >(`/admin/sites/${siteId}/people/${source}/${assignmentId}`)
    ).data,
};
