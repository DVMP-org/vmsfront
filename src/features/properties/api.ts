import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
export const propertyKinds = {
  site: "Organization site",
  building: "Building",
  unit: "Unit",
  room: "Room",
  space: "Space",
} as const;
export type PropertyKind = keyof typeof propertyKinds;
export type StructureKind = Exclude<PropertyKind, "site">;
export interface Property {
  id: string;
  parent_id: string | null;
  name: string;
  kind: PropertyKind;
  building_type?: string | null;
  use_case?: import("@/features/context/api").UseCase | null;
  description: string | null;
  address: string;
  is_active: boolean;
  updated_at: string;
}
export interface PropertyDetail extends Property {
  ancestors: Property[];
  children: Property[];
}
export type PropertyInput = {
  name: string;
  kind: StructureKind;
  description: string;
  address: string;
  parent_id?: string | null;
  building_type?: string | null;
  use_case?: import("@/features/context/api").UseCase | null;
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
  }) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Property>>>(base, {
        params,
      })
    ).data,
  get: async (id: string) =>
    (await apiClient.get<ApiResponse<PropertyDetail>>(`${base}/${id}`)).data,
  create: async (body: PropertyInput) =>
    (await apiClient.post<ApiResponse<Property>>(base, body)).data,
  update: async (id: string, body: Omit<PropertyInput, "parent_id" | "kind" | "building_type" | "use_case">) =>
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
