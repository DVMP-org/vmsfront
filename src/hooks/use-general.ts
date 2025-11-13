import { useQuery } from "@tanstack/react-query";
import { House } from "@/types";
import { generalService } from "@/services/general-service";
export function useAllHouses(enabled: Boolean | null = true) {
    return useQuery({
        queryKey: ["onboarding", "houses"],
        queryFn: async () => {
            const response = await generalService.getAllHouses();
            return response.data;
        },
        // enabled: enabled,
        staleTime: 1000 * 60 * 5,
    });
}
