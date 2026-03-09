import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";
import { staffService } from "@/services/staff-service";
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
} from "@/types/staff";
import { PaginatedResponse } from "@/types";

export function useResidencyStaff(
    residencyId: string | null,
    params: {
        page: number;
        pageSize: number;
        search?: string;
        status?: string;
        staffType?: string;
        sort?: string | null;
        filters?: string;
    },
) {
    return useQuery<PaginatedResponse<StaffMember>>({
        queryKey: ["resident", "staff", residencyId, params],
        queryFn: async () => {
            if (!residencyId) throw new Error("Residency ID is required");
            const response = await staffService.getResidencyStaff(residencyId, params);
            return response.data;
        },
        enabled: !!residencyId,
    });
}

export function useResidencyStaffMember(
    residencyId: string | null,
    staffId: string | null,
) {
    return useQuery<StaffMember>({
        queryKey: ["resident", "staff", residencyId, staffId],
        queryFn: async () => {
            if (!residencyId || !staffId) throw new Error("Staff member is required");
            const response = await staffService.getResidencyStaffMember(residencyId, staffId);
            return response.data;
        },
        enabled: !!residencyId && !!staffId,
    });
}

export function useCreateResidencyStaff(residencyId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: StaffProfileCreate) => {
            if (!residencyId) throw new Error("Residency ID is required");
            return staffService.createResidencyStaff(residencyId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "staff", residencyId] });
            toast.success("Staff created successfully");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useUpdateResidencyStaffMember(residencyId: string | null, staffId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: StaffAssignmentUpdate) => {
            if (!residencyId || !staffId) throw new Error("Staff member is required");
            return staffService.updateResidencyStaffMember(residencyId, staffId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "staff", residencyId] });
            queryClient.invalidateQueries({ queryKey: ["resident", "staff", residencyId, staffId] });
            toast.success("Staff assignment updated");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useCreateStaffPermission(residencyId: string | null, staffId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: StaffMovementPermissionCreate) => {
            if (!residencyId || !staffId) throw new Error("Staff member is required");
            return staffService.createStaffPermission(residencyId, staffId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "staff", residencyId, staffId] });
            toast.success("Movement permission saved");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useStaffMovementLogs(
    residencyId: string | null,
    staffId: string | null,
    params: {
        page: number;
        pageSize: number;
        search?: string;
        sort?: string | null;
        filters?: string;
    },
) {
    return useQuery<PaginatedResponse<StaffMovementLog>>({
        queryKey: ["resident", "staff", residencyId, staffId, "movement-logs", params],
        queryFn: async () => {
            if (!residencyId || !staffId) throw new Error("Staff member is required");
            const response = await staffService.getStaffMovementLogs(residencyId, staffId, params);
            return response.data;
        },
        enabled: !!residencyId && !!staffId,
    });
}

export function useSubmitStaffKyc(residencyId: string | null, staffId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: StaffKYCSubmit) => {
            if (!residencyId || !staffId) throw new Error("Staff member is required");
            return staffService.submitStaffKyc(residencyId, staffId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "staff", residencyId, staffId] });
            queryClient.invalidateQueries({ queryKey: ["resident", "staff", residencyId, staffId, "kyc"] });
            toast.success("KYC submitted successfully");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useStaffKycHistory(residencyId: string | null, staffId: string | null) {
    return useQuery<StaffKYCVerification[]>({
        queryKey: ["resident", "staff", residencyId, staffId, "kyc"],
        queryFn: async () => {
            if (!residencyId || !staffId) throw new Error("Staff member is required");
            const response = await staffService.getStaffKycHistory(residencyId, staffId);
            return response.data;
        },
        enabled: !!residencyId && !!staffId,
    });
}

export function useAdminStaff(
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
) {
    return useQuery<PaginatedResponse<StaffMember>>({
        queryKey: ["admin", "staff", params],
        queryFn: async () => {
            const response = await staffService.getAdminStaff(params);
            return response.data;
        },
    });
}

export function useAdminStaffMember(staffId: string | null) {
    return useQuery<StaffMember>({
        queryKey: ["admin", "staff", staffId],
        queryFn: async () => {
            if (!staffId) throw new Error("Staff member is required");
            const response = await staffService.getAdminStaffMember(staffId);
            return response.data;
        },
        enabled: !!staffId,
    });
}

export function useUpdateAdminStaffStatus(staffId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (status: { status: string }) => {
            if (!staffId) throw new Error("Staff member is required");
            return staffService.updateAdminStaffStatus(staffId, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "staff", staffId] });
            toast.success("Staff status updated");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useAdminStaffMovementLogs(
    params: {
        page: number;
        pageSize: number;
        search?: string;
        staffId?: string;
        status?: string;
        sort?: string | null;
        filters?: string;
    },
) {
    return useQuery<PaginatedResponse<StaffMovementLog>>({
        queryKey: ["admin", "staff", "movement-logs", params],
        queryFn: async () => {
            const response = await staffService.getAdminStaffMovementLogs(params);
            return response.data;
        },
    });
}

export function useReviewStaffKyc(staffId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: StaffKYCReview) => {
            if (!staffId) throw new Error("Staff member is required");
            return staffService.reviewStaffKyc(staffId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "staff", staffId] });
            toast.success("KYC review saved");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}
