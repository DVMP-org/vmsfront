import { apiClient } from "@/lib/api-client";
import type { ApiResponse, User } from "@/types";

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string | null;
}

export const profileApi = {
  /** The signed-in Party's badge pass (created on first read if missing). */
  badge: async () =>
    (
      await apiClient.get<
        ApiResponse<{ badge_id: string; display_name: string }>
      >("/user/badge")
    ).data,
  /** Update the signed-in person's shared identity record. */
  update: async (body: ProfileUpdate) =>
    (await apiClient.put<ApiResponse<User>>("/user/me", body)).data,
  /** Upload a shared profile image; the API stores it and returns its URL. */
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return (
      await apiClient.post<ApiResponse<{ avatar_url: string }>>(
        "/user/avatar",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
    ).data;
  },
};
