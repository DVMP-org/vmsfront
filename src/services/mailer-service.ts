import { apiClient } from "@/lib/api-client";
import { ApiResponse, MailerSettings, UpdateMailerSettingsRequest } from "@/types";

export const mailerService = {
    // Get mailer settings
    async getMailerSettings(): Promise<ApiResponse<MailerSettings>> {
        return apiClient.get("/admin/config/mailer/settings");
    },

    // Update mailer settings
    async updateMailerSettings(
        data: UpdateMailerSettingsRequest
    ): Promise<ApiResponse<MailerSettings>> {
        return apiClient.put("/admin/config/mailer/settings/update", data);
    },
};
