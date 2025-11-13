import { apiClient } from "@/lib/api-client";
import { ApiResponse, House } from "@/types";



export const generalService = {
    async getAllHouses(): Promise<ApiResponse<House[]>> {
        return apiClient.get('/users/houses/list')
    }
}