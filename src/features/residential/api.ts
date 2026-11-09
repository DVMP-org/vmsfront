import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  PaginatedResponse,
  WorkspaceRelationship,
} from "@/types";
import { chargesApi, type Assignment } from "@/features/charges/api";
import {
  propertiesApi,
  type Property,
  type PropertyTreeNode,
} from "@/features/properties/api";
import type {
  Announcement,
  AnnouncementInput,
  MaintenanceInput,
  MaintenanceRequest,
} from "./contracts";
import { useAppStore } from "@/store/app-store";

type ListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  priority?: string;
};

const maintenanceBase = "/admin/residential/maintenance";
const announcementBase = "/admin/residential/announcements";

const unwrap = async <T>(request: Promise<ApiResponse<T>>) =>
  (await request).data;

export interface RelationshipInput {
  party_id: string;
  place_id: string;
  role: string;
  status: "pending" | "active";
  effective_from?: string | null;
  effective_to?: string | null;
}

export const residentialApi = {
  units: async (
    params: {
      search?: string;
      is_active?: boolean;
      parent_id?: string;
    } = {},
  ) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Property>>>(
        "/admin/places",
        {
          params: {
            page: 1,
            page_size: 100,
            kind: "unit",
            is_active: params.is_active,
            parent_id: params.parent_id,
            search: params.search,
            site_id: useAppStore.getState().selectedProperty?.id,
          },
        },
      )
    ).data,
  tree: (): Promise<PropertyTreeNode[]> => {
    const siteId = useAppStore.getState().selectedProperty?.id;
    return siteId ? propertiesApi.tree(siteId) : Promise.resolve([]);
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
  maintenance: async (params: ListParams = {}) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<MaintenanceRequest>>>(
        maintenanceBase,
        {
          params: { page: 1, page_size: 100, ...params },
        },
      )
    ).data,
  createMaintenance: (body: MaintenanceInput) =>
    unwrap(
      apiClient.post<ApiResponse<MaintenanceRequest>>(maintenanceBase, body),
    ),
  updateMaintenance: (
    id: string,
    body: Partial<
      Pick<
        MaintenanceRequest,
        "status" | "priority" | "assigned_to_party_id" | "due_at"
      >
    >,
  ) =>
    unwrap(
      apiClient.patch<ApiResponse<MaintenanceRequest>>(
        `${maintenanceBase}/${id}`,
        body,
      ),
    ),
  announcements: async (params: ListParams = {}) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Announcement>>>(
        announcementBase,
        {
          params: { page: 1, page_size: 100, ...params },
        },
      )
    ).data,
  createAnnouncement: (body: AnnouncementInput) =>
    unwrap(apiClient.post<ApiResponse<Announcement>>(announcementBase, body)),
  updateAnnouncement: (
    id: string,
    body: Partial<AnnouncementInput & { status: Announcement["status"] }>,
  ) =>
    unwrap(
      apiClient.patch<ApiResponse<Announcement>>(
        `${announcementBase}/${id}`,
        body,
      ),
    ),
};

export function flattenPlaces(roots: PropertyTreeNode[]): PropertyTreeNode[] {
  const output: PropertyTreeNode[] = [];
  const visit = (node: PropertyTreeNode) => {
    output.push(node);
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  return output;
}

export function descendantIds(
  roots: PropertyTreeNode[],
  rootId: string,
): Set<string> {
  const root = flattenPlaces(roots).find((place) => place.id === rootId);
  if (!root) return new Set();
  return new Set(flattenPlaces([root]).map((place) => place.id));
}
