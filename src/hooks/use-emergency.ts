import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emergencyService } from "@/services/emergency-service";
import { Emergency, PaginatedResponse, TriggerEmergencyRequest } from "@/types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";

// ── Admin hooks ───────────────────────────────────────────────────────────────

export function useAdminEmergencies(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    emergency_type?: string;
    severity?: string;
    search?: string;
    sort?: string;
}) {
    return useQuery<PaginatedResponse<Emergency>>({
        queryKey: ["admin", "emergencies", params],
        queryFn: async () => {
            const response = await emergencyService.getEmergencies(params);
            return response.data;
        },
    });
}

export function useAdminEmergency(id: string | null) {
    return useQuery<Emergency>({
        queryKey: ["admin", "emergencies", id],
        queryFn: async () => {
            const response = await emergencyService.getEmergency(id!);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useActiveEmergencies() {
    return useQuery<PaginatedResponse<Emergency>>({
        queryKey: ["admin", "emergencies", "active"],
        queryFn: async () => {
            const response = await emergencyService.getEmergencies({ status: "active", pageSize: 5 });
            return response.data;
        },
        refetchInterval: 30_000, // poll every 30s
        staleTime: 20_000,
    });
}

export function useTriggerEmergencyAdmin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TriggerEmergencyRequest) =>
            emergencyService.triggerEmergencyAdmin(data),
        onSuccess: (res) => {
            toast.success(res.message ?? "Emergency alert triggered.");
            queryClient.invalidateQueries({ queryKey: ["admin", "emergencies"] });
        },
        onError: (err) => {
            toast.error(parseApiError(err));
        },
    });
}

export function useAcknowledgeEmergency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => emergencyService.acknowledgeEmergency(id),
        onSuccess: (res) => {
            toast.success(res.message ?? "Emergency acknowledged.");
            queryClient.invalidateQueries({ queryKey: ["admin", "emergencies"] });
        },
        onError: (err) => {
            toast.error(parseApiError(err));
        },
    });
}

export function useResolveEmergency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => emergencyService.resolveEmergency(id),
        onSuccess: (res) => {
            toast.success(res.message ?? "Emergency resolved.");
            queryClient.invalidateQueries({ queryKey: ["admin", "emergencies"] });
        },
        onError: (err) => {
            toast.error(parseApiError(err));
        },
    });
}

// ── Resident hooks ────────────────────────────────────────────────────────────

export function useTriggerEmergencyResident() {
    return useMutation({
        mutationFn: (data: TriggerEmergencyRequest) =>
            emergencyService.triggerEmergencyResident(data),
        onSuccess: (res) => {
            toast.success(res.message ?? "Emergency alert triggered. Security has been alerted.");
        },
        onError: (err) => {
            toast.error(parseApiError(err));
        },
    });
}
