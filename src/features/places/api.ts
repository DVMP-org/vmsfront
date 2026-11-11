import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  PaginatedResponse,
  WorkspaceRelationship,
} from "@/types";
export const placeKinds = {
  building: "Building",
  unit: "Unit",
  room: "Room",
  space: "Space",
} as const;
export type PlaceKind = keyof typeof placeKinds;
export type StructureKind = PlaceKind;
export interface Place {
  id: string;
  site_id: string;
  parent_id: string | null;
  name: string;
  kind: PlaceKind;
  building_type?: string | null;
  description: string | null;
  address: string;
  is_active: boolean;
  updated_at: string;
  slug?: string;
}
export interface PlaceDetail extends Place {
  ancestors: Place[];
  children: Place[];
}
export interface PlaceTreeNode extends Place {
  children: PlaceTreeNode[];
}
export type PlaceInput = {
  site_id: string;
  name: string;
  kind: StructureKind;
  description: string;
  address: string;
  parent_id?: string | null;
  building_type?: string | null;
};
const base = "/admin/places";
export const placesApi = {
  list: async (params: {
    page: number;
    page_size: number;
    search?: string;
    kind?: string;
    is_active?: boolean;
    root_only?: boolean;
    parent_id?: string;
    site_id?: string;
  }) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Place>>>(base, {
        params,
      })
    ).data,
  tree: async (siteId: string, includeInactive = false) =>
    (
      await apiClient.get<ApiResponse<PlaceTreeNode[]>>(`${base}/tree`, {
        params: { include_inactive: includeInactive, site_id: siteId },
      })
    ).data,
  get: async (id: string) =>
    (await apiClient.get<ApiResponse<PlaceDetail>>(`${base}/${id}`)).data,
  create: async (body: PlaceInput) =>
    (await apiClient.post<ApiResponse<Place>>(base, body)).data,
  update: async (
    id: string,
    body: Omit<
      PlaceInput,
      "site_id" | "parent_id" | "kind" | "building_type"
    >,
  ) =>
    (await apiClient.patch<ApiResponse<Place>>(`${base}/${id}`, body)).data,
  move: async (id: string, parent_id: string | null) =>
    (
      await apiClient.post<ApiResponse<Place>>(`${base}/${id}/move`, {
        parent_id,
      })
    ).data,
  toggle: async (id: string, active: boolean) =>
    (
      await apiClient.post<ApiResponse<Place>>(
        `${base}/${id}/${active ? "activate" : "archive"}`,
      )
    ).data,
};

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
