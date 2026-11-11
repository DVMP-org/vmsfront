import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
export const propertyKinds = {
  building: "Building",
  unit: "Unit",
  room: "Room",
  space: "Space",
} as const;
export type PropertyKind = keyof typeof propertyKinds;
export type StructureKind = PropertyKind;
export interface Property {
  id: string;
  site_id: string;
  parent_id: string | null;
  name: string;
  kind: PropertyKind;
  building_type?: string | null;
  description: string | null;
  address: string;
  is_active: boolean;
  updated_at: string;
  slug?: string;
}
export interface PropertyDetail extends Property {
  ancestors: Property[];
  children: Property[];
}
export interface PropertyTreeNode extends Property {
  children: PropertyTreeNode[];
}
export type PropertyInput = {
  site_id: string;
  name: string;
  kind: StructureKind;
  description: string;
  address: string;
  parent_id?: string | null;
  building_type?: string | null;
};
const base = "/admin/places";
export const propertiesApi = {
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
      await apiClient.get<ApiResponse<PaginatedResponse<Property>>>(base, {
        params,
      })
    ).data,
  tree: async (siteId: string, includeInactive = false) =>
    (
      await apiClient.get<ApiResponse<PropertyTreeNode[]>>(`${base}/tree`, {
        params: { include_inactive: includeInactive, site_id: siteId },
      })
    ).data,
  get: async (id: string) =>
    (await apiClient.get<ApiResponse<PropertyDetail>>(`${base}/${id}`)).data,
  create: async (body: PropertyInput) =>
    (await apiClient.post<ApiResponse<Property>>(base, body)).data,
  update: async (
    id: string,
    body: Omit<
      PropertyInput,
      "site_id" | "parent_id" | "kind" | "building_type"
    >,
  ) =>
    (await apiClient.patch<ApiResponse<Property>>(`${base}/${id}`, body)).data,
  move: async (id: string, parent_id: string | null) =>
    (
      await apiClient.post<ApiResponse<Property>>(`${base}/${id}/move`, {
        parent_id,
      })
    ).data,
  toggle: async (id: string, active: boolean) =>
    (
      await apiClient.post<ApiResponse<Property>>(
        `${base}/${id}/${active ? "activate" : "archive"}`,
      )
    ).data,
};
