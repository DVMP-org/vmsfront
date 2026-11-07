import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  PaginatedResponse,
  WorkspaceRelationship,
} from "@/types";

export const hospitalityPeopleApi = {
  list: async () =>
    (
      await apiClient.get<
        ApiResponse<PaginatedResponse<WorkspaceRelationship>>
      >("/admin/place-relationships", {
        params: {
          page: 1,
          page_size: 100,
          status: "active",
        },
      })
    ).data,
};
