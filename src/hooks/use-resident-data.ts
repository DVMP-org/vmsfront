import { useQuery } from "@tanstack/react-query";
import { residentService } from "@/services/resident-service";
import { DashboardSelect, Residency, ResidentDashboard, ResidentResidency } from "@/types";
import { useAuthStore } from "@/store/auth-store";

export function useResidentDashboardSelect() {
    const { isAuthenticated, _hasHydrated, token } = useAuthStore();
    
    return useQuery<DashboardSelect>({
        queryKey: ["resident", "dashboard-select"],
        queryFn: async () => {
            const response = await residentService.getDashboardSelect();
            const user = response.data;

            return user;
        },
        enabled: _hasHydrated && (isAuthenticated || !!token),
    });
}

export function useResidentResidencies() {
    return useQuery<ResidentResidency[]>({
        queryKey: ["resident", "residencies"],
        queryFn: async () => {
            const response = await residentService.getResidencies();
            return response.data;
        },
    });
}

export function useResidentDashboard(residencyId: string | null) {
    return useQuery<ResidentDashboard>({
        queryKey: ["resident", "dashboard", residencyId],
        queryFn: async () => {
            if (!residencyId) throw new Error("Residency ID is required");
            const response = await residentService.getDashboard(residencyId);
            return response.data;
        },
        enabled: !!residencyId,
    });
}


export function useResidentResidency(residencyId: string | null) {
    return useQuery<ResidentResidency>({
        queryKey: ["resident", "residency", residencyId],
        queryFn: async () => {
            if (!residencyId) throw new Error("Residency ID is required")
            const response = await residentService.getResidentResidency(residencyId);
            return response.data;
        },
        enabled: !!residencyId,
    });
}
