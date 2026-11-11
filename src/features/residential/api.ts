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
import type { Announcement, AnnouncementInput } from "./contracts";
import { useAppStore } from "@/store/app-store";

type ListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  priority?: string;
};

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
      await apiClient.get<ApiResponse<PaginatedResponse<Place>>>(
        "/admin/places",
        {
          params: {
            page: 1,
            page_size: 100,
            kind: "unit",
            is_active: params.is_active,
            parent_id: params.parent_id,
            search: params.search,
            site_id: useAppStore.getState().selectedSite?.id,
          },
        },
      )
    ).data,
  tree: (): Promise<PlaceTreeNode[]> => {
    const siteId = useAppStore.getState().selectedSite?.id;
    return siteId ? placesApi.tree(siteId) : Promise.resolve([]);
  },
  relationships: async (
    params: {
      place_id?: string;
      party_id?: string;
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
  relationship: (id: string) =>
    unwrap(
      apiClient.get<ApiResponse<WorkspaceRelationship>>(
        `/admin/place-relationships/${encodeURIComponent(id)}`,
      ),
    ),
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
    return new Set(flattenPlaces(roots).map((place) => place.id));
  }
  return new Set(flattenPlaces([root]).map((place) => place.id));
}
