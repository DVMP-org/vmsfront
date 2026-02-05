import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { residentService } from "@/services/resident-service";
import {
    ResidentUserCreate,
    ResidentProfileUpdatePayload,
    PaginatedResponse,
    ResidentUser,
    Resident,
    ResidentResidency,
    ResidentCreate,
} from "@/types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";

export function useResidencyResidents(
    residencyId: string | null,
    params: {
        page?: number;
        pageSize?: number;
        search?: string;
    } = {}
) {
    return useQuery<PaginatedResponse<ResidentResidency>>({
        queryKey: ["resident", "residency-residents", residencyId, params],
        queryFn: async () => {
            if (!residencyId) throw new Error("Residency ID is required");
            const response = await residentService.getResidencyResidents(residencyId, params);
            // @ts-ignore - Check if response structure matches what we expect, sometimes data wrapper is tricky
            return response.data;
        },
        enabled: !!residencyId,
    });
}

export function useAddResidencyResident(residencyId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ResidentCreate) => {
            if (!residencyId) throw new Error("Residency ID is required");
            return residentService.addResidencyResident(residencyId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "residency-residents", residencyId] });
            toast.success("Resident added successfully");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useGetResidencyGroups(residencyId: string | null) {
    return useQuery({
        queryKey: ["resident", "residency-groups", residencyId],
        queryFn: async () => {
            if (!residencyId) throw new Error("Residency ID is required");
            const response = await residentService.getResidencyGroups(residencyId);
            return response.data;
        },
        enabled: !!residencyId,
    });
}

export function useUpdateResidencyResident(residencyId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ residentId, data }: { residentId: string; data: ResidentProfileUpdatePayload }) => {
            if (!residencyId) throw new Error("Residency ID is required");
            return residentService.updateResidencyResident(residencyId, residentId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "residency-residents", residencyId] });
            toast.success("Resident updated successfully");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useDeleteResidencyResident(residencyId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (residentId: string) => {
            if (!residencyId) throw new Error("Residency ID is required");
            return residentService.deleteResidencyResident(residencyId, residentId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "residency-residents", residencyId] });
            toast.success("Resident deleted successfully");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useToggleResidencyResidentStatus(residencyId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (residentId: string) => {
            if (!residencyId) throw new Error("Residency ID is required");
            return residentService.toggleResidentStatus(residencyId, residentId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "residency-residents", residencyId] });
            toast.success("Resident status toggled successfully");
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });
}
