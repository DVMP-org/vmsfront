import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  PaginatedResponse,
  WorkspaceRelationship,
} from "@/types";
import { chargesApi, type Assignment } from "@/features/charges/api";
import {
  placesApi,
  type Place,
  type PlaceTreeNode,
} from "@/features/places/api";
import type {
  CommercialMaintenanceInput,
  CommercialMaintenanceRequest,
} from "./contracts";
import { useAppStore } from "@/store/app-store";

export interface RelationshipInput {
  party_id: string;
  place_id: string;
  role: string;
  status: "pending" | "active";
  effective_from?: string | null;
  effective_to?: string | null;
}

const maintenanceBase = "/admin/commercial/maintenance";

const unwrap = async <T>(request: Promise<ApiResponse<T>>) =>
  (await request).data;

export const commercialApi = {
  tree: (): Promise<PlaceTreeNode[]> => {
    const siteId = useAppStore.getState().selectedSite?.id;
    return siteId ? placesApi.tree(siteId) : Promise.resolve([]);
  },
  relationships: async (
    params: {
      place_id?: string;
      status?: string;
      role?: string;
    } = {},
  ) =>
    (
      await apiClient.get<
        ApiResponse<PaginatedResponse<WorkspaceRelationship>>
      >("/admin/place-relationships", {
        params: { page: 1, page_size: 100, ...params },
      })
    ).data,
  createRelationship: (body: RelationshipInput) =>
    unwrap(
      apiClient.post<ApiResponse<WorkspaceRelationship>>(
        "/admin/place-relationships",
        body,
      ),
    ),
  updateRelationship: (
    id: string,
    body: {
      status?: "pending" | "active" | "ended" | "suspended";
      effective_from?: string | null;
      effective_to?: string | null;
    },
  ) =>
    unwrap(
      apiClient.patch<ApiResponse<WorkspaceRelationship>>(
        `/admin/place-relationships/${id}`,
        body,
      ),
    ),
  chargeAssignments: async (): Promise<Assignment[]> => {
    const first = await chargesApi.allAssignments(1);
    const assignments = [...first.items];
    for (let page = 2; page <= first.total_pages; page += 1) {
      const next = await chargesApi.allAssignments(page);
      assignments.push(...next.items);
    }
    return assignments;
  },
  maintenance: async (
    params: {
      page?: number;
      page_size?: number;
      search?: string;
      status?: string;
      priority?: string;
    } = {},
  ) =>
    (
      await apiClient.get<
        ApiResponse<PaginatedResponse<CommercialMaintenanceRequest>>
      >(maintenanceBase, {
        params: { page: 1, page_size: 100, ...params },
      })
    ).data,
  createMaintenance: (body: CommercialMaintenanceInput) =>
    unwrap(
      apiClient.post<ApiResponse<CommercialMaintenanceRequest>>(
        maintenanceBase,
        body,
      ),
    ),
  updateMaintenance: (
    id: string,
    body: Partial<
      Pick<
        CommercialMaintenanceRequest,
        "status" | "priority" | "assigned_to_party_id" | "due_at"
      >
    >,
  ) =>
    unwrap(
      apiClient.patch<ApiResponse<CommercialMaintenanceRequest>>(
        `${maintenanceBase}/${id}`,
        body,
      ),
    ),
};

export function flattenPlaces(roots: PlaceTreeNode[]): PlaceTreeNode[] {
  const output: PlaceTreeNode[] = [];
  const visit = (node: PlaceTreeNode) => {
    output.push(node);
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  return output;
}

export function descendantIds(
  roots: PlaceTreeNode[],
  rootId: string,
): Set<string> {
  const root = flattenPlaces(roots).find((place) => place.id === rootId);
  if (!root) {
    // The id belongs to the Site, not a Place: the tree is already site-scoped,
    // so every node is in scope. Returning an empty set here silently emptied
    // inventory, parties and access screens on freshly created commercial Sites.
    return new Set(flattenPlaces(roots).map((place) => place.id));
  }
  return new Set(flattenPlaces([root]).map((place) => place.id));
}

export function isCommercialInventory(place: Place) {
  return (
    ["unit", "space"].includes(place.kind) &&
    ["office", "shop", "retail_unit", "warehouse", "conference_room"].includes(
      place.building_type || "",
    )
  );
}
