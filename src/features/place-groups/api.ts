import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface PlaceGroup {
  id: string;
  organization_id: string;
  site_id: string;
  name: string;
  description: string | null;
  created_by_site_admin_id: string | null;
  places: Array<{ id: string; name: string }>;
  created_at: string;
  updated_at: string;
}

export const placeGroupsApi = {
  list: async () =>
    (await apiClient.get<ApiResponse<PlaceGroup[]>>("/admin/place-groups"))
      .data,
  create: async (body: {
    site_id: string;
    name: string;
    description?: string | null;
    place_ids: string[];
  }) =>
    (await apiClient.post<ApiResponse<PlaceGroup>>("/admin/place-groups", body))
      .data,
  update: async (
    id: string,
    body: {
      name?: string;
      description?: string | null;
      place_ids?: string[];
    },
  ) =>
    (
      await apiClient.patch<ApiResponse<PlaceGroup>>(
        `/admin/place-groups/${id}`,
        body,
      )
    ).data,
};
