import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  PaginatedResponse,
  WorkspaceRelationship,
} from "@/types";
export { propertiesApi as placesApi } from "@/features/properties/api";
export type {
  Property as Place,
  PropertyDetail as PlaceDetail,
} from "@/features/properties/api";

export const placeRelationshipsApi = {
  list: async (
    params: { place_id?: string; status?: string; role?: string } = {},
  ) => {
    const first = (
      await apiClient.get<
        ApiResponse<PaginatedResponse<WorkspaceRelationship>>
      >("/admin/place-relationships", {
        params: { page: 1, page_size: 100, ...params },
      })
    ).data;
    const items = [...first.items];
    for (let page = 2; page <= first.total_pages; page += 1) {
      const next = (
        await apiClient.get<
          ApiResponse<PaginatedResponse<WorkspaceRelationship>>
        >("/admin/place-relationships", {
          params: { page, page_size: 100, ...params },
        })
      ).data;
      items.push(...next.items);
    }
    return { ...first, items };
  },
  create: async (body: {
    party_id: string;
    place_id: string;
    role: string;
    status: "pending" | "active";
    effective_from?: string | null;
    effective_to?: string | null;
  }) =>
    (
      await apiClient.post<ApiResponse<WorkspaceRelationship>>(
        "/admin/place-relationships",
        body,
      )
    ).data,
};
