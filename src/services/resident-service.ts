import { apiClient } from "@/lib/api-client";
import {
  House,
  GatePass,
  CreateGatePassRequest,
  ResidentDashboard,
  Visitor,
  ApiResponse,
  Resident,
  PaginatedResponse,
  ResidentUser,
  ResidentUserCreate,
  ForumCategory,
  ForumTopic,
  ForumPost,
  ForumCategoryPayload,
  ForumCategoryUpdatePayload,
  ForumTopicCreatePayload,
  ForumTopicUpdatePayload,
  ForumPostCreatePayload,
  ForumPostUpdatePayload,
  ResidentProfileUpdatePayload,
} from "@/types";

export const residentService = {
  async getHouses(): Promise<ApiResponse<House[]>> {
    return apiClient.get("/resident/house/list");
  },

  async getResident(): Promise<ApiResponse<Resident>> {
    return apiClient.get("/resident/me");
  },

  async updateResidentProfile(
    data: ResidentProfileUpdatePayload
  ): Promise<ApiResponse<Resident>> {
    return apiClient.put("/resident/me", data);
  },

  async getDashboard(houseId: string): Promise<ApiResponse<ResidentDashboard>> {
    return apiClient.get(`/resident/house/${houseId}/dashboard`);
  },

  async createGatePass(houseId: string, data: CreateGatePassRequest): Promise<ApiResponse<GatePass>> {
    return apiClient.post(`/resident/house/${houseId}/gate-passes`, data);
  },

  async getGatePasses(
    houseId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<GatePass>>> {
    return apiClient.get(`/resident/house/${houseId}/gate-passes`, {
      params: {
        page,
        page_size: pageSize,
      },
    });
  },

  async getGatePass(houseId: string, passId: string): Promise<ApiResponse<GatePass>> {
    return apiClient.get(`/resident/house/${houseId}/gate-passes/${passId}`);
  },

  async revokeGatePass(houseId: string, passId: string): Promise<ApiResponse<GatePass>> {
    return apiClient.post(`/resident/house/${houseId}/gate-passes/${passId}/revoke`);
  },

  async getVisitors(
    houseId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Visitor>>> {
    return apiClient.get(`/resident/house/${houseId}/visitors`, {
      params: { page, page_size: pageSize },
    });
  },

  async getVisitorsByGatePass(houseId: string, gatePassId: string): Promise<ApiResponse<Visitor[]>> {
    return apiClient.get(`/resident/house/${houseId}/gate-passes/${gatePassId}/visitors`);
  },

  async getVisitor(
    houseId: string,
    visitorId: string
  ): Promise<ApiResponse<Visitor>> {
    return apiClient.get(`/resident/house/${houseId}/visitors/${visitorId}`);
  },

  async onboardResident(data: ResidentUserCreate): Promise<ApiResponse<ResidentUser>> {
    return apiClient.post("/resident/onboard", data);
  },

  // Forum Categories
  async createForumCategory(
    data: ForumCategoryPayload
  ): Promise<ApiResponse<ForumCategory>> {
    return apiClient.post("/resident/house/forum/category/create", data);
  },

  async updateForumCategory(
    houseId: string,
    categoryId: string,
    data: ForumCategoryUpdatePayload
  ): Promise<ApiResponse<ForumCategory>> {
    return apiClient.put(
      `/resident/house/${houseId}/forum/category/${categoryId}/update`,
      data
    );
  },

  async deleteForumCategory(
    houseId: string,
    categoryId: string
  ): Promise<ApiResponse<{ ok: boolean; message: string }>> {
    return apiClient.delete(
      `/resident/house/${houseId}/forum/category/${categoryId}/delete`
    );
  },

  async getForumCategory(
    houseId: string,
    categoryId: string
  ): Promise<ApiResponse<ForumCategory>> {
    return apiClient.get(`/resident/house/${houseId}/forum/category/${categoryId}`);
  },

  async getForumCategories(
    houseId: string,
    params?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<ApiResponse<PaginatedResponse<ForumCategory>>> {
    return apiClient.get(`/resident/house/${houseId}/forum/categories`, {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 100,
      },
    });
  },

  // Forum Topics
  async createForumTopic(
    data: ForumTopicCreatePayload
  ): Promise<ApiResponse<ForumTopic>> {
    return apiClient.post("/resident/house/forum/topic/create", data);
  },

  async getForumTopic(
    houseId: string,
    topicId: string
  ): Promise<ApiResponse<ForumTopic>> {
    return apiClient.get(
      `/resident/house/${houseId}/forum/topic/${topicId}`
    );
  },

  async getForumTopics(
    houseId: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      includeDeleted?: boolean;
    }
  ): Promise<ApiResponse<PaginatedResponse<ForumTopic>>> {
    return apiClient.get(`/resident/house/${houseId}/forum/topics`, {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 20,
        search_query: params?.search ?? undefined,
        include_deleted: params?.includeDeleted ?? undefined,
      },
    });
  },

  async updateForumTopic(
    houseId: string,
    topicId: string,
    data: ForumTopicUpdatePayload
  ): Promise<ApiResponse<ForumTopic>> {
    return apiClient.put(
      `/resident/house/${houseId}/forum/topic/${topicId}/update`,
      data
    );
  },

  async deleteForumTopic(
    houseId: string,
    topicId: string
  ): Promise<ApiResponse<{ ok: boolean; message: string }>> {
    return apiClient.delete(
      `/resident/house/${houseId}/forum/topic/${topicId}/delete`
    );
  },

  // Forum Posts
  async createForumPost(
    houseId: string,
    data: ForumPostCreatePayload
  ): Promise<ApiResponse<ForumPost>> {
    return apiClient.post(
      `/resident/house/${houseId}/forum/topic/post/create`,
      data
    );
  },

  async getForumPosts(
    houseId: string,
    topicId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<ForumPost>>> {
    return apiClient.get(
      `/resident/house/${houseId}/forum/topic/${topicId}/post/all`,
      {
        params: {
          page,
          page_size: pageSize,
        },
      }
    );
  },

  async updateForumPost(
    houseId: string,
    topicId: string,
    postId: string,
    data: ForumPostUpdatePayload
  ): Promise<ApiResponse<ForumPost>> {
    return apiClient.put(
      `/resident/house/${houseId}/forum/topic${topicId}/post/${postId}/update`,
      data
    );
  },
};
