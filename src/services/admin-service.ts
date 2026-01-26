import { apiClient } from "@/lib/api-client";
import {
    House,
    HouseGroup,
    CreateHouseRequest,
    CreateHouseGroupRequest,
    UpdateHouseGroupRequest,
    Admin,
    CreateAdminRequest,
    AdminRole,
    ResidentUser,
    ResidentUserCreate,
    Transaction,
    ResidentProfileUpdatePayload,
    GatePass,
    GatePassCheckinRequest,
    GatePassCheckinResponse,
    GateEvent,
    Visitor,
    ApiResponse,
    AdminDashboard,
    AnalyticsSummary,
    AllPermissionsResponse,
    PaginatedResponse,
    User,
    ImportResponse,
    AdminProfileUpdatePayload,
    ForumCategory,
    ForumCategoryPayload,
    ForumCategoryUpdatePayload,
    ForumTopic,
    ForumTopicCreatePayload,
    ForumTopicUpdatePayload,
    ForumPost,
    ForumPostCreatePayload,
    ForumPostUpdatePayload,
    UpdateAdminRoleRequest,
    BrandingTheme,
    CreateBrandingThemeRequest,
    UpdateBrandingThemeRequest,
    PaymentGateway,
    UpdatePaymentGatewayRequest,
    HouseDetail,
    Resident,
    ResidentHouse,
    Due,
    CreateDueRequest,
    HouseDue,
    DueSchedule,
    DuePayment,
} from "@/types";

export const adminService = {
    // Dashboard
    async getDashboard(): Promise<ApiResponse<AdminDashboard>> {
        return apiClient.get("/admin/dashboard");
    },

    async getAnalyticsSummary(): Promise<ApiResponse<AnalyticsSummary>> {
        return apiClient.get("/admin/analytics/summary");
    },

    async getAdminProfile(): Promise<ApiResponse<Admin>> {
        return apiClient.get("/admin/me");
    },

    async updateAdminProfile(data: AdminProfileUpdatePayload): Promise<ApiResponse<Admin>> {
        return apiClient.put("/admin/me", data);
    },

    // Houses
    async getHouses(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<House>>> {
        return apiClient.get("/admin/houses", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async createHouse(data: { name: string; description?: string; address: string }): Promise<ApiResponse<House>> {
        return apiClient.post("/admin/houses/create", data);
    },

    async getHouse(houseId: string): Promise<ApiResponse<House>> {
        return apiClient.get(`/admin/houses/${houseId}`);
    },

    async getHouseResidents(houseId: string): Promise<ApiResponse<ResidentHouse[]>> {
        return apiClient.get(`/admin/houses/${houseId}/residents`);
    },

    async updateHouse(
        houseId: string,
        data: { name?: string; description?: string; address?: string; house_group_id?: string }
    ): Promise<ApiResponse<House>> {
        return apiClient.put(`/admin/houses/${houseId}/update`, data);
    },

    async deleteHouse(houseId: string): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.delete(`/admin/houses/${houseId}/delete`);
    },

    async bulkDeleteHouses(houseIds: string[]): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.post("/admin/houses/delete/bulk", houseIds);
    },

    async toggleHouseActive(houseId: string): Promise<ApiResponse<House>> {
        return apiClient.post(`/admin/houses/${houseId}/toggle-active`);
    },

    async bulkToggleHouseActive(houseIds: string[]): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.post("/admin/houses/toggle-active/bulk", houseIds);
    },

    // House Groups
    async getHouseGroups(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<HouseGroup>>> {
        return apiClient.get("/admin/house/group/list", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async getHouseGroup(groupId: string): Promise<ApiResponse<HouseGroup>> {
        return apiClient.get(`/admin/house/group/${groupId}`);
    },

    async createHouseGroup(data: CreateHouseGroupRequest): Promise<ApiResponse<HouseGroup>> {
        return apiClient.post("/admin/house/groups", data);
    },

    async updateHouseGroup(
        groupId: string,
        data: UpdateHouseGroupRequest
    ): Promise<ApiResponse<HouseGroup>> {
        return apiClient.put(`/admin/house/group/${groupId}/update`, data);
    },

    async deleteHouseGroup(groupId: string): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.delete(`/admin/house/group/${groupId}/delete`);
    },

    async bulkDeleteHouseGroups(groupIds: string[]): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.post("/admin/house/group/delete/bulk", groupIds);
    },

    async toggleHouseGroupActive(groupId: string): Promise<ApiResponse<HouseGroup>> {
        return apiClient.post(`/admin/house/group/${groupId}/toggle-active`);
    },

    async bulkToggleHouseGroupActive(groupIds: string[]): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.post("/admin/house/group/toggle-active/bulk", groupIds);
    },

    // Residents
    async getResidents(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        status?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<ResidentUser>>> {
        return apiClient.get("/admin/resident/list", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                status: params?.status ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async getResident(residentId: string): Promise<ApiResponse<Resident>> {
        return apiClient.get(`/admin/resident/${residentId}`);
    },

    async getResidentHouses(residentId: string): Promise<ApiResponse<ResidentHouse[]>> {
        return apiClient.get(`/admin/resident/${residentId}/houses`);
    },

    async updateResident(
        residentId: string,
        data: ResidentProfileUpdatePayload
    ): Promise<ApiResponse<ResidentUser>> {
        return apiClient.put(`/admin/resident/update/${residentId}`, data);
    },

    async deleteResident(
        residentId: string
    ): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.delete(`/admin/resident/delete/${residentId}`);
    },

    async createResident(data: ResidentUserCreate): Promise<ApiResponse<ResidentUser>> {
        return apiClient.post("/admin/resident/create", data);
    },

    async getUsers(): Promise<ApiResponse<User[]>> {
        return apiClient.get("/admin/user/list");
    },

    // Admins
    async getAdmins(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        sort?: string;
        filters?: string;
    }): Promise<ApiResponse<PaginatedResponse<Admin>>> {
        return apiClient.get("/admin/admins/list", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                sort: params?.sort ?? undefined,
                filters: params?.filters ?? undefined,
            },
        });
    },

    async createAdmin(data: CreateAdminRequest): Promise<ApiResponse<Admin>> {
        return apiClient.post("/admin/admins/create", data);
    },

    async updateAdminRole(adminId: string, data: UpdateAdminRoleRequest): Promise<ApiResponse<Admin>> {
        return apiClient.put(`/admin/admins/update/${adminId}`, data);
    },

    async deleteAdmin(adminId: string): Promise<ApiResponse<Admin>> {
        return apiClient.delete(`/admin/admins/delete/${adminId}`);
    },

    // Roles
    async getRoles(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        sort?: string;
        filters?: string;
    }): Promise<ApiResponse<PaginatedResponse<AdminRole>>> {
        return apiClient.get("/admin/role/list", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                sort: params?.sort ?? undefined,
                filters: params?.filters ?? undefined,
            },
        });
    },

    async getRole(roleId: string): Promise<ApiResponse<AdminRole>> {
        return apiClient.get(`/admin/role/${roleId}`);
    },

    async createRole(data: {
        name: string;
        code: string;
        description?: string;
        permissions?: any;
    }): Promise<ApiResponse<AdminRole>> {
        return apiClient.post("/admin/role/create", data);
    },

    async updateRole(
        roleId: string,
        data: Partial<{
            name: string;
            code: string;
            description?: string;
            permissions?: any;
        }>
    ): Promise<ApiResponse<AdminRole>> {
        return apiClient.put(`/admin/role/${roleId}`, data);
    },

    async deleteRole(roleId: string): Promise<ApiResponse<AdminRole>> {
        return apiClient.delete(`/admin/role/${roleId}`);
    },

    // Gate Operations
    async checkinPass(data: GatePassCheckinRequest): Promise<ApiResponse<GatePassCheckinResponse>> {
        return apiClient.post("/admin/passes/checkin", data);
    },

    async checkoutPass(data: GatePassCheckinRequest): Promise<ApiResponse<GatePassCheckinResponse>> {
        return apiClient.post("/admin/passes/checkout", data);
    },

    async getVisitorsByPassCode(passCode: string): Promise<ApiResponse<Visitor[]>> {
        return apiClient.get(`/admin/passes/visitors/${passCode}`);
    },

    async getVisitors(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<Visitor>>> {
        return apiClient.get("/admin/visitors", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async getVisitor(visitorId: string): Promise<ApiResponse<Visitor>> {
        return apiClient.get(`/admin/visitors/${visitorId}`);
    },

    async getAllPermissions(): Promise<ApiResponse<AllPermissionsResponse>> {
        return apiClient.get("/admin/role/permissions/all");
    },

    async getGatePasses(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        status?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<GatePass>>> {
        return apiClient.get("/admin/gate-passes/", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                status: params?.status ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async getGatePass(passId: string): Promise<ApiResponse<GatePass>> {
        return apiClient.get(`/admin/gate-passes/${passId}`);
    },

    async getGateEvents(params?: {
        page?: number;
        pageSize?: number;
        passId?: string;
        houseId?: string;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<GateEvent>>> {
        return apiClient.get("/admin/gate-events/", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 15,
                pass_id: params?.passId ?? undefined,
                house_id: params?.houseId ?? undefined,
                search: params?.search ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async getGateEvent(eventId: string): Promise<ApiResponse<GateEvent>> {
        return apiClient.get(`/admin/gate-events/${eventId}`);
    },

    async getGatePassEvents(
        passId: string,
        params?: { page?: number; pageSize?: number }
    ): Promise<ApiResponse<GateEvent[]>> {
        return apiClient.get(`/admin/gate-passes/${passId}/events`, {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
            },
        });
    },

    async importHouses(formData: FormData): Promise<ApiResponse<ImportResponse>> {
        return apiClient.post("/admin/houses/create/bulk", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    async importResidents(formData: FormData): Promise<ApiResponse<ImportResponse>> {
        return apiClient.post("/admin/resident/create/bulk", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    // Forum (Admin)
    async getForumCategories(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        sort?: string;
        filters?: string;
    }): Promise<ApiResponse<PaginatedResponse<ForumCategory>>> {
        return apiClient.get("/admin/forum/category/list", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 12,
                search: params?.search ?? undefined,
                sort: params?.sort ?? undefined,
                filters: params?.filters ?? undefined,
            },
        });
    },

    async getForumCategory(categoryId: string): Promise<ApiResponse<ForumCategory>> {
        return apiClient.get(`/admin/forum/category/${categoryId}`);
    },

    async createForumCategory(
        data: ForumCategoryPayload
    ): Promise<ApiResponse<ForumCategory>> {
        return apiClient.post("/admin/forum/category/create", data);
    },

    async updateForumCategory(
        categoryId: string,
        data: ForumCategoryUpdatePayload
    ): Promise<ApiResponse<ForumCategory>> {
        return apiClient.put(`/admin/forum/category/${categoryId}/update`, data);
    },

    async deleteForumCategory(
        categoryId: string
    ): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.delete(`/admin/forum/category/${categoryId}/delete`);
    },

    async getForumTopics(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<ForumTopic>>> {
        return apiClient.get("/admin/forum/topics", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                filters: params?.filters ?? undefined,
                search: params?.search ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async getForumTopic(topicId: string): Promise<ApiResponse<ForumTopic>> {
        return apiClient.get(`/admin/forum/topic/${topicId}`);
    },

    async createForumTopic(
        data: ForumTopicCreatePayload
    ): Promise<ApiResponse<ForumTopic>> {
        return apiClient.post("/admin/forum/topic/create", data);
    },

    async updateForumTopic(
        topicId: string,
        data: ForumTopicUpdatePayload
    ): Promise<ApiResponse<ForumTopic>> {
        return apiClient.put(`/admin/forum/topic/${topicId}/update`, data);
    },

    async deleteForumTopic(
        topicId: string
    ): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.delete(`/admin/forum/topic/${topicId}/delete`);
    },

    async getForumPosts(
        topicId: string,
        params?: { page?: number; pageSize?: number }
    ): Promise<ApiResponse<PaginatedResponse<ForumPost>>> {
        return apiClient.get(`/admin/forum/topic/${topicId}/post/all`, {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 20,
            },
        });
    },

    async createForumPost(
        data: ForumPostCreatePayload
    ): Promise<ApiResponse<ForumPost>> {
        return apiClient.post("/admin/forum/topic/post/create", data);
    },

    async updateForumPost(
        topicId: string,
        postId: string,
        data: ForumPostUpdatePayload
    ): Promise<ApiResponse<ForumPost>> {
        return apiClient.put(
            `/admin/forum/topic/${topicId}/post/${postId}/update`,
            data
        );
    },

    // Plugins
    async getPlugins(): Promise<ApiResponse<any[]>> {
        return apiClient.get("/admin/plugins");
    },

    async togglePlugin(pluginId: string): Promise<ApiResponse<any>> {
        return apiClient.put(`/admin/plugins/${pluginId}/enable`);
    },

    async getPluginSettings(pluginId: string): Promise<ApiResponse<any>> {
        return apiClient.get(`/admin/plugins/${pluginId}`);
    },

    // Branding Themes
    async getBrandingThemes(): Promise<ApiResponse<BrandingTheme[]>> {
        return apiClient.get("/admin/branding/themes");
    },

    async getActiveBrandingTheme(): Promise<ApiResponse<BrandingTheme>> {
        return apiClient.get("/admin/branding/theme/active");
    },

    async createBrandingTheme(
        data: CreateBrandingThemeRequest
    ): Promise<ApiResponse<BrandingTheme>> {
        return apiClient.post("/admin/branding/theme/create", data);
    },

    async updateBrandingTheme(
        themeId: string,
        data: UpdateBrandingThemeRequest
    ): Promise<ApiResponse<BrandingTheme>> {
        return apiClient.put(`/admin/branding/theme/${themeId}/update`, data);
    },

    async deleteBrandingTheme(
        themeId: string
    ): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.delete(`/admin/branding/theme/${themeId}/delete`);
    },

    async activateBrandingTheme(
        themeId: string
    ): Promise<ApiResponse<BrandingTheme>> {
        return apiClient.post(`/admin/branding/theme/${themeId}/activate`);
    },

    // Payment Gateways
    async getPaymentGateways(): Promise<ApiResponse<PaymentGateway[]>> {
        return apiClient.get("/admin/config/payment/list");
    },

    async updatePaymentGateway(
        gatewayName: string,
        data: UpdatePaymentGatewayRequest
    ): Promise<ApiResponse<PaymentGateway>> {
        return apiClient.put(`/admin/config/payment/gateway/${gatewayName}/update`, data);
    },

    // Dues
    async getDues(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<Due>>> {
        return apiClient.get("/admin/dues/", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async createDue(data: CreateDueRequest): Promise<ApiResponse<Due>> {
        return apiClient.post("/admin/dues/create", data);
    },

    async getDue(dueId: string): Promise<ApiResponse<Due>> {
        return apiClient.get(`/admin/dues/${dueId}`);
    },

    async updateDue(dueId: string, data: Partial<CreateDueRequest>): Promise<ApiResponse<Due>> {
        return apiClient.put(`/admin/dues/${dueId}/update`, data);
    },

    async deleteDue(dueId: string): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.delete(`/admin/dues/${dueId}/delete`);
    },

    async getDueHouses(dueId: string, params?: {
        page?: number;
        pageSize?: number;
        search?: string;
    }): Promise<ApiResponse<PaginatedResponse<HouseDue>>> {
        return apiClient.get(`/admin/dues/${dueId}/houses`, {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
            },
        });
    },

    async getHouseDue(dueId: string, houseId: string): Promise<ApiResponse<HouseDue>> {
        return apiClient.get(`/admin/dues/${dueId}/house/${houseId}`);
    },

    async getDueSchedules(
        dueId: string,
        houseId: string,
        page: number = 1,
        pageSize: number = 10,
        filters?: string,
        sorts?: string
    ): Promise<ApiResponse<PaginatedResponse<DueSchedule>>> {
        return apiClient.get(`/admin/dues/${dueId}/house/${houseId}/schedules`, {
            params: {
                page,
                page_size: pageSize,
                filters,
                sorts
            },
        });
    },

    async getDuePayments(
        dueId: string,
        houseId: string,
        page: number = 1,
        pageSize: number = 10,
        filters?: string,
        sorts?: string
    ): Promise<ApiResponse<PaginatedResponse<DuePayment>>> {
        return apiClient.get(`/admin/dues/${dueId}/house/${houseId}/payments`, {
            params: {
                page,
                page_size: pageSize,
                filters,
                sorts
            },
        });
    },

    async getTransactions(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
        return apiClient.get('/admin/transactions', {
            params: {
                page: params.page ?? 1,
                page_size: params.pageSize ?? 15,
                search: params.search ?? undefined,
                filters: params.filters ?? undefined,
                sort: params.sort ?? undefined,
            },
        });
    },

    async getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
        return apiClient.get(`/admin/transactions/${transactionId}`);
    },
};
