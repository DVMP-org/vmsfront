import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { residentService } from "@/services/resident-service";
import {
    ResidentUserCreate,
    ResidentProfileUpdatePayload,
    PaginatedResponse,
    ResidentUser,
    Resident,
    ResidentHouse,
    ResidentCreate,
} from "@/types";
import { toast } from "sonner";

export function useHouseResidents(
    houseId: string | null,
    params: {
        page?: number;
        pageSize?: number;
        search?: string;
    } = {}
) {
    return useQuery<PaginatedResponse<ResidentHouse>>({
        queryKey: ["resident", "house-residents", houseId, params],
        queryFn: async () => {
            if (!houseId) throw new Error("House ID is required");
            const response = await residentService.getHouseResidents(houseId, params);
            // @ts-ignore - Check if response structure matches what we expect, sometimes data wrapper is tricky
            return response.data;
        },
        enabled: !!houseId,
    });
}

export function useAddHouseResident(houseId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ResidentCreate) => {
            if (!houseId) throw new Error("House ID is required");
            return residentService.addHouseResident(houseId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "house-residents", houseId] });
            toast.success("Resident added successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to add resident");
        },
    });
}

export function useGetHouseGroups(houseId: string | null) {
    return useQuery({
        queryKey: ["resident", "house-groups", houseId],
        queryFn: async () => {
            if (!houseId) throw new Error("House ID is required");
            const response = await residentService.getHouseGroups(houseId);
            return response.data;
        },
        enabled: !!houseId,
    });
}

export function useUpdateHouseResident(houseId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ residentId, data }: { residentId: string; data: ResidentProfileUpdatePayload }) => {
            if (!houseId) throw new Error("House ID is required");
            return residentService.updateHouseResident(houseId, residentId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "house-residents", houseId] });
            toast.success("Resident updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to update resident");
        },
    });
}

export function useDeleteHouseResident(houseId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (residentId: string) => {
            if (!houseId) throw new Error("House ID is required");
            return residentService.deleteHouseResident(houseId, residentId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "house-residents", houseId] });
            toast.success("Resident deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to delete resident");
        },
    });
}

export function useToggleHouseResidentStatus(houseId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (residentId: string) => {
            if (!houseId) throw new Error("House ID is required");
            return residentService.toggleResidentStatus(houseId, residentId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resident", "house-residents", houseId] });
            toast.success("Resident status toggled successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to toggle resident status");
        },
    });
}
