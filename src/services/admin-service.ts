import { apiClient } from "@/lib/api-client";
import {
    Residency,
    ResidencyGroup,
    CreateResidencyRequest,
    CreateResidencyGroupRequest,
    UpdateResidencyGroupRequest,
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
    ResidencyDetail,
    Resident,
    ResidentResidency,
    Due,
    CreateDueRequest,
    ResidencyDue,
    DueSchedule,
    DuePayment,
    ResidencyType,
} from "@/types";
import { get } from "http";

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

    // Residencies
    async getResidencies(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<Residency>>> {
        return apiClient.get("/admin/residencies", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async createResidency(data: { name: string; description?: string; address: string }): Promise<ApiResponse<Residency>> {
        return apiClient.post("/admin/residencies/create", data);
    },

    async getResidency(residencyId: string): Promise<ApiResponse<Residency>> {
        return apiClient.get(`/admin/residencies/${residencyId}`);
    },

    async getResidencyResidents(residencyId: string): Promise<ApiResponse<ResidentResidency[]>> {
        return apiClient.get(`/admin/residencies/${residencyId}/residents`);
    },

    async updateResidency(
        residencyId: string,
        data: { name?: string; description?: string; address?: string; residency_group_id?: string }
    ): Promise<ApiResponse<Residency>> {
        return apiClient.put(`/admin/residencies/${residencyId}/update`, data);
    },

    async deleteResidency(residencyId: string): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.delete(`/admin/residencies/${residencyId}/delete`);
    },

    async bulkDeleteResidencies(residencyIds: string[]): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.post("/admin/residencies/delete/bulk", residencyIds);
    },

    async toggleResidencyActive(residencyId: string): Promise<ApiResponse<Residency>> {
        return apiClient.post(`/admin/residencies/${residencyId}/toggle-active`);
    },

    async bulkToggleResidencyActive(residencyIds: string[]): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.post("/admin/residencies/toggle-active/bulk", residencyIds);
    },

    // Residency Types
    async getResidencyTypes(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<ResidencyType>>> {
        return apiClient.get("/admin/residency/types", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },
    async getResidencyType(typeId: string): Promise<ApiResponse<ResidencyType>> {
        return apiClient.get(`/admin/residency/type/${typeId}`);
    },

    // Residency Groups
    async getResidencyGroups(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<ResidencyGroup>>> {
        return apiClient.get("/admin/residency/group/list", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
                filters: params?.filters ?? undefined,
                sort: params?.sort ?? undefined,
            },
        });
    },

    async getResidencyGroup(groupId: string): Promise<ApiResponse<ResidencyGroup>> {
        return apiClient.get(`/admin/residency/group/${groupId}`);
    },

    async createResidencyGroup(data: CreateResidencyGroupRequest): Promise<ApiResponse<ResidencyGroup>> {
        return apiClient.post("/admin/residency/groups", data);
    },

    async updateResidencyGroup(
        groupId: string,
        data: UpdateResidencyGroupRequest
    ): Promise<ApiResponse<ResidencyGroup>> {
        return apiClient.put(`/admin/residency/group/${groupId}/update`, data);
    },

    async deleteResidencyGroup(groupId: string): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.delete(`/admin/residency/group/${groupId}/delete`);
    },

    async bulkDeleteResidencyGroups(groupIds: string[]): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.post("/admin/residency/group/delete/bulk", groupIds);
    },

    async toggleResidencyGroupActive(groupId: string): Promise<ApiResponse<ResidencyGroup>> {
        return apiClient.post(`/admin/residency/group/${groupId}/toggle-active`);
    },

    async bulkToggleResidencyGroupActive(groupIds: string[]): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
        return apiClient.post("/admin/residency/group/toggle-active/bulk", groupIds);
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

    async getResidentResidencies(residentId: string): Promise<ApiResponse<ResidentResidency[]>> {
        return apiClient.get(`/admin/resident/${residentId}/residencies`);
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
        residencyId?: string;
        search?: string;
        filters?: string;
        sort?: string;
    }): Promise<ApiResponse<PaginatedResponse<GateEvent>>> {
        return apiClient.get("/admin/gate-events/", {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 15,
                pass_id: params?.passId ?? undefined,
                residency_id: params?.residencyId ?? undefined,
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

    async importResidencies(formData: FormData): Promise<ApiResponse<ImportResponse>> {
        return apiClient.post("/admin/residencies/create/bulk", formData, {
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

    async getDueResidencies(dueId: string, params?: {
        page?: number;
        pageSize?: number;
        search?: string;
    }): Promise<ApiResponse<PaginatedResponse<ResidencyDue>>> {
        return apiClient.get(`/admin/dues/${dueId}/residencies`, {
            params: {
                page: params?.page ?? 1,
                page_size: params?.pageSize ?? 10,
                search: params?.search ?? undefined,
            },
        });
    },

    async getResidencyDue(dueId: string, residencyId: string): Promise<ApiResponse<ResidencyDue>> {
        return apiClient.get(`/admin/dues/${dueId}/residency/${residencyId}`);
    },

    async getDueSchedules(
        dueId: string,
        residencyId: string,
        page: number = 1,
        pageSize: number = 10,
        filters?: string,
        sorts?: string
    ): Promise<ApiResponse<PaginatedResponse<DueSchedule>>> {
        return apiClient.get(`/admin/dues/${dueId}/residency/${residencyId}/schedules`, {
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
        residencyId: string,
        page: number = 1,
        pageSize: number = 10,
        filters?: string,
        sorts?: string
    ): Promise<ApiResponse<PaginatedResponse<DuePayment>>> {
        return apiClient.get(`/admin/dues/${dueId}/residency/${residencyId}/payments`, {
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

    async streamLogs(): Promise<ApiResponse<any>> {
        return apiClient.get('/admin/logs/stream');
    },
};
