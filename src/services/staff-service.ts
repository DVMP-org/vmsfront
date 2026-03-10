import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
    StaffAssignmentUpdate,
    StaffKYCReview,
    StaffKYCSubmit,
    StaffKYCVerification,
    StaffMember,
    StaffMovementLog,
    StaffMovementPermission,
    StaffMovementPermissionCreate,
    StaffProfileCreate,
    StaffStatusUpdate,
} from "@/types/staff";

const residentBase = (residencyId: string) => `/resident/residency/${residencyId}/staff`;
const adminBase = "/admin/staff";

export const staffService = {
    async createResidencyStaff(
        residencyId: string,
        data: StaffProfileCreate,
    ): Promise<ApiResponse<StaffMember>> {
        return apiClient.post(residentBase(residencyId), data);
    },

    async getResidencyStaff(
        residencyId: string,
        params: {
            page: number;
            pageSize: number;
            search?: string;
            status?: string;
            staffType?: string;
            sort?: string | null;
            filters?: string;
        },
    ): Promise<ApiResponse<PaginatedResponse<StaffMember>>> {
        return apiClient.get(residentBase(residencyId), {
            params: {
                page: params.page ?? 1,
                page_size: params.pageSize ?? 10,
                search: params.search || undefined,
                status: params.status || undefined,
                staff_type: params.staffType || undefined,
                sort: params.sort || undefined,
                filters: params.filters || undefined,
            },
        });
    },

    async getResidencyStaffMember(
        residencyId: string,
        staffId: string,
    ): Promise<ApiResponse<StaffMember>> {
        return apiClient.get(`${residentBase(residencyId)}/${staffId}`);
    },

    async updateResidencyStaffMember(
        residencyId: string,
        staffId: string,
        data: StaffAssignmentUpdate,
    ): Promise<ApiResponse<StaffMember>> {
        return apiClient.patch(`${residentBase(residencyId)}/${staffId}`, data);
    },

    async createStaffPermission(
        residencyId: string,
        staffId: string,
        data: StaffMovementPermissionCreate,
    ): Promise<ApiResponse<StaffMovementPermission>> {
        return apiClient.post(`${residentBase(residencyId)}/${staffId}/movement-permission`, data);
    },

    async getStaffMovementLogs(
        residencyId: string,
        staffId: string,
        params: {
            page: number;
            pageSize: number;
            search?: string;
            sort?: string | null;
            filters?: string;
        },
    ): Promise<ApiResponse<PaginatedResponse<StaffMovementLog>>> {
        return apiClient.get(`${residentBase(residencyId)}/${staffId}/movement-logs`, {
            params: {
                page: params.page ?? 1,
                page_size: params.pageSize ?? 10,
                search: params.search || undefined,
                sort: params.sort || undefined,
                filters: params.filters || undefined,
            },
        });
    },

    async submitStaffKyc(
        residencyId: string,
        staffId: string,
        data: StaffKYCSubmit,
    ): Promise<ApiResponse<StaffKYCVerification>> {
        return apiClient.post(`${residentBase(residencyId)}/${staffId}/kyc`, data);
    },

    async getStaffKycHistory(
        residencyId: string,
        staffId: string,
    ): Promise<ApiResponse<StaffKYCVerification[]>> {
        return apiClient.get(`${residentBase(residencyId)}/${staffId}/kyc`);
    },

    async getAdminStaff(
        params: {
            page: number;
            pageSize: number;
            search?: string;
            status?: string;
            staffType?: string;
            kycStatus?: string;
            sort?: string | null;
            filters?: string;
        },
    ): Promise<ApiResponse<PaginatedResponse<StaffMember>>> {
        return apiClient.get(adminBase, {
            params: {
                page: params.page ?? 1,
                page_size: params.pageSize ?? 10,
                search: params.search || undefined,
                status: params.status || undefined,
                staff_type: params.staffType || undefined,
                kyc_status: params.kycStatus || undefined,
                sort: params.sort || undefined,
                filters: params.filters || undefined,
            },
        });
    },

    async getAdminStaffMember(staffId: string): Promise<ApiResponse<StaffMember>> {
        return apiClient.get(`${adminBase}/${staffId}`);
    },

    async updateAdminStaffStatus(
        staffId: string,
        data: StaffStatusUpdate,
    ): Promise<ApiResponse<StaffMember>> {
        return apiClient.patch(`${adminBase}/${staffId}/status`, data);
    },

    async getAdminStaffMovementLogs(
        params: {
            page: number;
            pageSize: number;
            search?: string;
            staffId?: string;
            status?: string;
            sort?: string | null;
            filters?: string;
        },
    ): Promise<ApiResponse<PaginatedResponse<StaffMovementLog>>> {
        return apiClient.get(`${adminBase}/movement-logs`, {
            params: {
                page: params.page ?? 1,
                page_size: params.pageSize ?? 10,
                search: params.search || undefined,
                staff_id: params.staffId || undefined,
                status: params.status || undefined,
                sort: params.sort || undefined,
                filters: params.filters || undefined,
            },
        });
    },

    async reviewStaffKyc(
        staffId: string,
        data: StaffKYCReview,
    ): Promise<ApiResponse<StaffKYCVerification>> {
        return apiClient.post(`${adminBase}/${staffId}/kyc/review`, data);
    },
};
