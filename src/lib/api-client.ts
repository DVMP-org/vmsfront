import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { useAuthStore } from "@/store/auth-store";
import { getCookie } from "@/lib/cookies";
import { clearLegacyAuthStorage } from "@/lib/client-cache";
import { getSubdomain, buildRootDomainUrl } from "./subdomain-utils";

// Use production API URL in production, fallback to localhost for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
class ApiClient {
  private client: AxiosInstance;
  private tokenOverride: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}`,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        // Only add X-Organization header when on an organization subdomain
        const subdomain = getSubdomain();
        if (subdomain) {
          config.headers["X-Organization"] = subdomain;
        }
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          useAuthStore.getState().clearAuth();
          this.clearToken();
          if (typeof window !== "undefined") {
            const currentPath =
              window.location.pathname +
              window.location.search +
              window.location.hash;
            const onAuthRoute = window.location.pathname.startsWith("/auth");

            let redirectTo = "";
            if (!onAuthRoute && currentPath) {
              redirectTo = `?redirect_to=${encodeURIComponent(currentPath)}`;
            } else if (onAuthRoute) {
              const existingRedirect = new URL(window.location.href).searchParams.get("redirect_to");
              if (existingRedirect) {
                redirectTo = `?redirect_to=${encodeURIComponent(existingRedirect)}`;
              }
            }

            // Always redirect to root domain auth pages
            window.location.href = buildRootDomainUrl(`/auth/login${redirectTo}`);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      const stateToken = useAuthStore.getState().token;
      if (this.tokenOverride) return this.tokenOverride;
      if (stateToken) return stateToken;

      return getCookie("auth-token") || null;
    }
    return null;
  }

  public setToken(token: string): void {
    this.tokenOverride = token;
  }

  public clearToken(): void {
    this.tokenOverride = null;
    clearLegacyAuthStorage();
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
