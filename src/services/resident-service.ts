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
  Wallet,
  FundWalletRequest,
  FundWalletResponse,
  WalletTransaction,
  ResidentHouse,
  ResidentCreate,
  HouseDue,
  DueSchedule,
  DuePayment,
  DashboardSelect,
  ImportResponse,
} from "@/types";

export const residentService = {
  async getHouses(): Promise<ApiResponse<House[]>> {
    return apiClient.get("/resident/house/list");
  },

  async getDashboardSelect(): Promise<ApiResponse<DashboardSelect>> {
    return apiClient.get("/resident/dashboard/select");
  },

  async getResident(): Promise<ApiResponse<Resident>> {
    return apiClient.get("/resident/me");
  },

  async getResidentHouse(houseID: string): Promise<ApiResponse<ResidentHouse>> {
    return apiClient.get(`/resident/house/${houseID}`);
  },

  async updateHouse(houseId: string, data: { name: string; description?: string; address: string }): Promise<ApiResponse<House>> {
    return apiClient.put(`/resident/house/${houseId}`, data);
  },

  async getHouseGroups(houseId: string): Promise<ApiResponse<ResidentHouse[]>> {
    return apiClient.get(`/resident/house/${houseId}/groups`);
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
    params: {
      page: number;
      pageSize: number;
      search?: string;
      sort?: string;
      filters?: string
    }
  ): Promise<ApiResponse<PaginatedResponse<GatePass>>> {
    return apiClient.get(`/resident/house/${houseId}/gate-passes`, {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        sort: params.sort,
        filters: params.filters,
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
    params: {
      page: number;
      pageSize: number;
      search?: string;
      sort?: string;
      filters?: string
    }
  ): Promise<ApiResponse<PaginatedResponse<Visitor>>> {
    return apiClient.get(`/resident/house/${houseId}/visitors`, {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        sort: params.sort,
        filters: params.filters,
      },
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
      search?: string;
      filters?: string;
      sort?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<ForumCategory>>> {
    return apiClient.get(`/resident/house/${houseId}/forum/categories`, {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 100,
        search: params?.search ?? undefined,
        filters: params?.filters ?? undefined,
        sort: params?.sort ?? undefined,
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
      filters?: string;
      sort?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<ForumTopic>>> {
    return apiClient.get(`/resident/house/${houseId}/forum/topics`, {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 20,
        search: params?.search ?? undefined,
        filters: params?.filters ?? undefined,
        sort: params?.sort ?? undefined,
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
    params: {
      page: number;
      pageSize: number;
      search?: string;
      filters?: string;
      sort?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<ForumPost>>> {
    return apiClient.get(
      `/resident/house/${houseId}/forum/topic/${topicId}/post/all`,
      {
        params: {
          page: params.page,
          page_size: params.pageSize,
          search: params.search,
          filters: params.filters,
          sort: params.sort,
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

  // Wallet
  async getWallet(): Promise<ApiResponse<Wallet>> {
    return apiClient.get("/resident/wallet");
  },

  async fundWallet(data: FundWalletRequest): Promise<ApiResponse<FundWalletResponse>> {
    return apiClient.post("/resident/wallet/fund", data);
  },

  async getWalletHistory(
    params: {
      page: number;
      pageSize: number;
      search?: string;
      filters?: string;
      sort?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<WalletTransaction>>> {
    return apiClient.get("/resident/wallet/history", {
      params: {
        ...params
      },
    });
  },

  async getWalletTransaction(reference: string): Promise<ApiResponse<WalletTransaction>> {
    return apiClient.get(`/resident/wallet/transaction/${reference}`);
  },

  // House Residents Management (Super User)
  async getHouseResidents(
    houseId: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<ResidentHouse>>> {
    return apiClient.get(`/resident/house/${houseId}/residents`, {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 10,
        search: params?.search ?? undefined,
      },
    });
  },

  async addHouseResident(
    houseId: string,
    data: ResidentCreate
  ): Promise<ApiResponse<ResidentUser>> {
    return apiClient.post(`/resident/house/${houseId}/residents/create`, data);
  },

  async updateHouseResident(
    houseId: string,
    residentId: string,
    data: ResidentProfileUpdatePayload
  ): Promise<ApiResponse<ResidentUser>> {
    return apiClient.put(`/resident/house/${houseId}/residents/${residentId}`, data);
  },

  async deleteHouseResident(
    houseId: string,
    residentId: string
  ): Promise<ApiResponse<{ ok: boolean; message: string }>> {
    return apiClient.delete(`/resident/house/${houseId}/residents/${residentId}/delete`);
  },

  async toggleResidentStatus(
    houseId: string,
    residentId: string
  ): Promise<ApiResponse<ResidentHouse>> {
    return apiClient.put(`/resident/house/${houseId}/residents/${residentId}/toggle-status`);
  },

  async getHouseDues(
    houseId: string,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      sort?: string;
      filters?: string
    }
  ): Promise<ApiResponse<PaginatedResponse<HouseDue>>> {
    return apiClient.get(`/resident/house/${houseId}/dues`, {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 10,
        search: params?.search ?? undefined,
        sort: params?.sort ?? undefined,
        filters: params?.filters ?? undefined,
      },
    });
  },

  async getHouseDue(houseId: string, dueId: string): Promise<ApiResponse<HouseDue>> {
    return apiClient.get(`/resident/house/${houseId}/dues/${dueId}`);
  },

  async scheduleHouseDue(houseId: string, dueId: string, data: { payment_breakdown: string }): Promise<ApiResponse<HouseDue>> {
    return apiClient.post(`/resident/house/${houseId}/dues/${dueId}/schedule`, data);
  },

  async getDueSchedules(
    houseId: string,
    dueId: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: string
  ): Promise<ApiResponse<PaginatedResponse<DueSchedule>>> {
    return apiClient.get(`/resident/house/${houseId}/dues/${dueId}/schedules`, {
      params: { page, page_size: pageSize, filters },
    });
  },

  async getDuePayments(
    houseId: string,
    dueId: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: string
  ): Promise<ApiResponse<PaginatedResponse<DuePayment>>> {
    return apiClient.get(`/resident/house/${houseId}/dues/${dueId}/payments`, {
      params: { page, page_size: pageSize, filters },
    });
  },

  async payDueSchedule(
    houseId: string,
    dueId: string,
    scheduleId: string
  ): Promise<ApiResponse<FundWalletResponse>> {
    return apiClient.post(
      `/resident/house/${houseId}/dues/${dueId}/schedules/${scheduleId}/pay`
    );
  },
  async addVisitorsToGatePass(
    houseId: string,
    passId: string,
    data: { name: string; email: string; phone?: string }[]
  ): Promise<ApiResponse<Visitor[]>> {
    return apiClient.post(
      `/resident/house/${houseId}/gate-passes/${passId}/visitors`,
      { visitors: data }
    );
  },

  async removeVisitorFromGatePass(
    houseId: string,
    passId: string,
    visitorIds: string[]
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete(
      `/resident/house/${houseId}/gate-passes/${passId}/visitors`,
      { data: visitorIds }
    );
  },

  async uploadVisitorsToGatePass(
    houseId: string,
    passId: string,
    data: FormData
  ): Promise<ApiResponse<ImportResponse<Visitor>>> {
    return apiClient.post(
      `/resident/house/${houseId}/gate-passes/${passId}/visitors/bulk`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  async extendGatePass(
    houseId: string,
    passId: string,
    data: { valid_to: string }
  ): Promise<ApiResponse<GatePass>> {
    return apiClient.put(
      `/resident/house/${houseId}/gate-passes/${passId}/extend`,
      data
    );
  },
};
