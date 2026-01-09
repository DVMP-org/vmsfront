import { apiClient } from "@/lib/api-client";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  DashboardSelect,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types";

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post("/auth/login", data);
  },

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post("/auth/register", data);
  },

  async logout(): Promise<void> {
    return apiClient.post("/auth/logout");
  },

  async verifyToken(): Promise<ApiResponse<AuthResponse>> {
    return apiClient.get("/auth/verify");
  },

  async getDashboardSelect(): Promise<ApiResponse<DashboardSelect>> {
    return apiClient.get("/dashboard/select");
  },
  async getUser(): Promise<ApiResponse<AuthResponse["user"]>> {
    return apiClient.get("/users/me");
  },

  async updateProfile(data: Partial<RegisterRequest>): Promise<ApiResponse<AuthResponse["user"]>> {
    return apiClient.patch("/users/update-profile", data);
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<{ ok: boolean; message: string }>> {
    return apiClient.post("/auth/forgot-password", data);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<{ ok: boolean; message: string }>> {
    return apiClient.post("/auth/reset-password", data);
  },

  async onboard(data: any): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post("/auth/onboard", data);
  },
  async resendVerification(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post("/auth/verify-email-resent");
  },
};
