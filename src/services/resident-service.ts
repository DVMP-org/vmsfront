import { apiClient } from "@/lib/api-client";
import {
  Residency,
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
  ResidentResidency,
  ResidentCreate,
  ResidencyDue,
  DueSchedule,
  DuePayment,
  DashboardSelect,
  ImportResponse,
  CreateGatePassData,
  ApproveVisitResponse,
  VisitResponse,
} from "@/types";
import { getValueAsType } from "framer-motion";
import { get } from "http";

export const residentService = {
  async getResidencies(): Promise<ApiResponse<ResidentResidency[]>> {
    return apiClient.get("/resident/residency/list");
  },

  async getDashboardSelect(): Promise<ApiResponse<DashboardSelect>> {
    return apiClient.get("/resident/dashboard/select");
  },

  async getResident(): Promise<ApiResponse<Resident>> {
    return apiClient.get("/resident/me");
  },

  async getResidentResidency(residencyId: string): Promise<ApiResponse<ResidentResidency>> {
    return apiClient.get(`/resident/residency/${residencyId}`);
  },

  async updateResidency(residencyId: string, data: { name: string; description?: string; address: string }): Promise<ApiResponse<ResidentResidency>> {
    return apiClient.put(`/resident/residency/${residencyId}`, data);
  },

  async getResidencyGroups(residencyId: string): Promise<ApiResponse<ResidentResidency[]>> {
    return apiClient.get(`/resident/residency/${residencyId}/groups`);
  },

  async updateResidentProfile(
    data: ResidentProfileUpdatePayload
  ): Promise<ApiResponse<Resident>> {
    return apiClient.put("/resident/me", data);
  },

  async getDashboard(residencyId: string): Promise<ApiResponse<ResidentDashboard>> {
    return apiClient.get(`/resident/residency/${residencyId}/dashboard`);
  },

  async createGatePass(residencyId: string, data: CreateGatePassRequest): Promise<ApiResponse<GatePass>> {
    return apiClient.post(`/resident/residency/${residencyId}/gate-passes`, data);
  },

  async getGatePasses(
    residencyId: string,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      sort?: string;
      filters?: string
    }
  ): Promise<ApiResponse<PaginatedResponse<GatePass>>> {
    return apiClient.get(`/resident/residency/${residencyId}/gate-passes`, {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        sort: params.sort,
        filters: params.filters,
      },
    });
  },

  async getGatePass(residencyId: string, passId: string): Promise<ApiResponse<GatePass>> {
    return apiClient.get(`/resident/residency/${residencyId}/gate-passes/${passId}`);
  },

  async revokeGatePass(residencyId: string, passId: string): Promise<ApiResponse<GatePass>> {
    return apiClient.post(`/resident/residency/${residencyId}/gate-passes/${passId}/revoke`);
  },

  async getVisitors(
    residencyId: string,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      sort?: string;
      filters?: string
    }
  ): Promise<ApiResponse<PaginatedResponse<Visitor>>> {
    return apiClient.get(`/resident/residency/${residencyId}/visitors`, {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        sort: params.sort,
        filters: params.filters,
      },
    });
  },

  async getVisitorsByGatePass(residencyId: string, gatePassId: string): Promise<ApiResponse<Visitor[]>> {
    return apiClient.get(`/resident/residency/${residencyId}/gate-passes/${gatePassId}/visitors`);
  },

  async getVisitor(
    residencyId: string,
    visitorId: string
  ): Promise<ApiResponse<Visitor>> {
    return apiClient.get(`/resident/residency/${residencyId}/visitors/${visitorId}`);
  },

  async onboardResident(data: ResidentUserCreate): Promise<ApiResponse<ResidentUser>> {
    return apiClient.post("/resident/onboard", data);
  },

  // Forum Categories
  async createForumCategory(
    data: ForumCategoryPayload
  ): Promise<ApiResponse<ForumCategory>> {
    return apiClient.post("/resident/residency/forum/category/create", data);
  },

  async updateForumCategory(
    residencyId: string,
    categoryId: string,
    data: ForumCategoryUpdatePayload
  ): Promise<ApiResponse<ForumCategory>> {
    return apiClient.put(
      `/resident/residency/${residencyId}/forum/category/${categoryId}/update`,
      data
    );
  },

  async deleteForumCategory(
    residencyId: string,
    categoryId: string
  ): Promise<ApiResponse<{ ok: boolean; message: string }>> {
    return apiClient.delete(
      `/resident/residency/${residencyId}/forum/category/${categoryId}/delete`
    );
  },

  async getForumCategory(
    residencyId: string,
    categoryId: string
  ): Promise<ApiResponse<ForumCategory>> {
    return apiClient.get(`/resident/residency/${residencyId}/forum/category/${categoryId}`);
  },

  async getForumCategories(
    residencyId: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      filters?: string;
      sort?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<ForumCategory>>> {
    return apiClient.get(`/resident/residency/${residencyId}/forum/categories`, {
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
    return apiClient.post("/resident/residency/forum/topic/create", data);
  },

  async getForumTopic(
    residencyId: string,
    topicId: string
  ): Promise<ApiResponse<ForumTopic>> {
    return apiClient.get(
      `/resident/residency/${residencyId}/forum/topic/${topicId}`
    );
  },

  async getForumTopics(
    residencyId: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      filters?: string;
      sort?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<ForumTopic>>> {
    return apiClient.get(`/resident/residency/${residencyId}/forum/topics`, {
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
    residencyId: string,
    topicId: string,
    data: ForumTopicUpdatePayload
  ): Promise<ApiResponse<ForumTopic>> {
    return apiClient.put(
      `/resident/residency/${residencyId}/forum/topic/${topicId}/update`,
      data
    );
  },

  async deleteForumTopic(
    residencyId: string,
    topicId: string
  ): Promise<ApiResponse<{ ok: boolean; message: string }>> {
    return apiClient.delete(
      `/resident/residency/${residencyId}/forum/topic/${topicId}/delete`
    );
  },

  // Forum Posts
  async createForumPost(
    residencyId: string,
    data: ForumPostCreatePayload
  ): Promise<ApiResponse<ForumPost>> {
    return apiClient.post(
      `/resident/residency/${residencyId}/forum/topic/post/create`,
      data
    );
  },

  async getForumPosts(
    residencyId: string,
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
      `/resident/residency/${residencyId}/forum/topic/${topicId}/post/all`,
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
    residencyId: string,
    topicId: string,
    postId: string,
    data: ForumPostUpdatePayload
  ): Promise<ApiResponse<ForumPost>> {
    return apiClient.put(
      `/resident/residency/${residencyId}/forum/topic/${topicId}/post/${postId}/update`,
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

  // Residency Residents Management (Super User)
  async getResidencyResidents(
    residencyId: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<ResidentResidency>>> {
    return apiClient.get(`/resident/residency/${residencyId}/residents`, {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 10,
        search: params?.search ?? undefined,
      },
    });
  },

  async addResidencyResident(
    residencyId: string,
    data: ResidentCreate
  ): Promise<ApiResponse<ResidentUser>> {
    return apiClient.post(`/resident/residency/${residencyId}/residents/create`, data);
  },

  async updateResidencyResident(
    residencyId: string,
    residentId: string,
    data: ResidentProfileUpdatePayload
  ): Promise<ApiResponse<ResidentUser>> {
    return apiClient.put(`/resident/residency/${residencyId}/residents/${residentId}`, data);
  },

  async deleteResidencyResident(
    residencyId: string,
    residentId: string
  ): Promise<ApiResponse<{ ok: boolean; message: string }>> {
    return apiClient.delete(`/resident/residency/${residencyId}/residents/${residentId}/delete`);
  },

  async toggleResidentStatus(
    residencyId: string,
    residentId: string
  ): Promise<ApiResponse<ResidentResidency>> {
    return apiClient.put(`/resident/residency/${residencyId}/residents/${residentId}/toggle-status`);
  },

  async getResidencyDues(
    residencyId: string,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      sort?: string;
      filters?: string
    }
  ): Promise<ApiResponse<PaginatedResponse<ResidencyDue>>> {
    return apiClient.get(`/resident/residency/${residencyId}/dues`, {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 10,
        search: params?.search ?? undefined,
        sort: params?.sort ?? undefined,
        filters: params?.filters ?? undefined,
      },
    });
  },

  async getResidencyDue(residencyId: string, dueId: string): Promise<ApiResponse<ResidencyDue>> {
    return apiClient.get(`/resident/residency/${residencyId}/dues/${dueId}`);
  },

  async scheduleResidencyDue(residencyId: string, dueId: string, data: { payment_breakdown: string }): Promise<ApiResponse<ResidencyDue>> {
    return apiClient.post(`/resident/residency/${residencyId}/dues/${dueId}/schedule`, data);
  },

  async getDueSchedules(
    residencyId: string,
    dueId: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: string
  ): Promise<ApiResponse<PaginatedResponse<DueSchedule>>> {
    return apiClient.get(`/resident/residency/${residencyId}/dues/${dueId}/schedules`, {
      params: { page, page_size: pageSize, filters },
    });
  },

  async getDuePayments(
    residencyId: string,
    dueId: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: string
  ): Promise<ApiResponse<PaginatedResponse<DuePayment>>> {
    return apiClient.get(`/resident/residency/${residencyId}/dues/${dueId}/payments`, {
      params: { page, page_size: pageSize, filters },
    });
  },

  async payDueSchedule(
    residencyId: string,
    dueId: string,
    scheduleId: string
  ): Promise<ApiResponse<FundWalletResponse>> {
    return apiClient.post(
      `/resident/residency/${residencyId}/dues/${dueId}/schedules/${scheduleId}/pay`
    );
  },
  async addVisitorsToGatePass(
    residencyId: string,
    passId: string,
    data: { name: string; email: string; phone?: string }[]
  ): Promise<ApiResponse<Visitor[]>> {
    return apiClient.post(
      `/resident/residency/${residencyId}/gate-passes/${passId}/visitors`,
      { visitors: data }
    );
  },

  async removeVisitorFromGatePass(
    residencyId: string,
    passId: string,
    visitorIds: string[]
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete(
      `/resident/residency/${residencyId}/gate-passes/${passId}/visitors`,
      { data: visitorIds }
    );
  },

  async uploadVisitorsToGatePass(
    residencyId: string,
    passId: string,
    data: FormData
  ): Promise<ApiResponse<ImportResponse<Visitor>>> {
    return apiClient.post(
      `/resident/residency/${residencyId}/gate-passes/${passId}/visitors/bulk`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  async extendGatePass(
    residencyId: string,
    passId: string,
    data: { valid_to: string }
  ): Promise<ApiResponse<GatePass>> {
    return apiClient.put(
      `/resident/residency/${residencyId}/gate-passes/${passId}/extend`,
      data
    );
  },

    /**
   * Approve visit request - creates a gate pass with specified details
   */
  async approveVisitRequest(
    visitRequestId: string,
    data: CreateGatePassData
  ): Promise<ApiResponse<ApproveVisitResponse>> {
    return apiClient.post(`/resident/visit/request/${visitRequestId}/approve`, data);
  },

  /**
   * Decline visit request with optional reason
   */
  async declineVisitRequest(
    visitRequestId: string,
    reason?: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`/resident/visit/request/${visitRequestId}/decline`, { reason });
  },

  async getVisitRequest(
    visitRequestId: string): Promise<ApiResponse<VisitResponse>> {
    return apiClient.get(`/resident/visits/request/${visitRequestId}`);
  },
  async getVisitRequests(
    params: {
      page: number;
      pageSize: number;
      search?: string;
      sort?: string;
      filters?: string
    }
  ): Promise<ApiResponse<PaginatedResponse<VisitResponse>>> {
    return apiClient.get(`/resident/visits`, {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        sort: params.sort,
        filters: params.filters,
      },
    });
  }
};
