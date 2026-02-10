import { useQuery } from "@tanstack/react-query";
import { Residency } from "@/types";
import { generalService } from "@/services/general-service";
export function useAllResidencies(enabled: Boolean | null = true) {
    return useQuery({
        queryKey: ["onboarding", "residencies"],
        queryFn: async () => {
            const response = await generalService.getAllResidencies();
            return response.data;
        },
        // enabled: enabled,
        staleTime: 1000 * 60 * 5,
    });
}
