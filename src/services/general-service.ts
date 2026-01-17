import { apiClient } from "@/lib/api-client";
import { ApiResponse, House, Transaction, WalletTransaction } from "@/types";



export const generalService = {
    async getAllHouses(): Promise<ApiResponse<House[]>> {
        return apiClient.get('/users/houses/list')
    },

    async getTransaction(reference: string): Promise<ApiResponse<Transaction>> {
        return apiClient.get(`/transactions/${reference}`);
    },
}

