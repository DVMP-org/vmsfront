import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface PlacePerson {
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
  source: "administration" | "occupancy";
}

export interface PlacePeople {
  place: {
    id: string;
    name: string;
    slug: string;
    kind: string;
    is_active: boolean;
  };
  effective_use_case: "residential" | "commercial" | "hospitality" | "mixed_use";
  administrators: PlacePerson[];
  occupants: PlacePerson[];
}

export interface AddPlacePersonInput {
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
  place: PlacePeople["place"];
  onboarding_email: "queued" | "not_required";
  user_created: boolean;
}

export const peopleApi = {
  get: async (placeId: string) =>
    (
      await apiClient.get<ApiResponse<PlacePeople>>(
        `/admin/places/${placeId}/people`,
      )
    ).data,
  add: async (placeId: string, body: AddPlacePersonInput) =>
    (
      await apiClient.post<ApiResponse<AddPlacePersonResponse>>(
        `/admin/places/${placeId}/parties`,
        body,
      )
    ).data,
};
