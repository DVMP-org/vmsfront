import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

import { createCookieUtilities } from "./cookies";

const DEFAULT_API_URL = "https://vmscore.to";

export interface ApiBrowserLocation {
  href: string;
  origin: string;
  pathname: string;
  search: string;
  hash: string;
}

export interface StoredAuthTokenOptions {
  getCookie?: (name: string) => string | null;
  storage?: Pick<Storage, "getItem" | "removeItem"> | null;
}

export interface ApiClientOptions {
  baseURL?: string;
  axiosInstance?: AxiosInstance;
  getToken?: () => string | null;
  getOrganizationSlug?: () => string | null;
  getPropertyId?: () => string | null;
  onUnauthorized?: () => void | Promise<void>;
  getLocation?: () => ApiBrowserLocation;
  navigate?: (url: string) => void;
}

function getBrowserStorage(): Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
> | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getStoredAuthToken(
  options: StoredAuthTokenOptions = {},
): string | null {
  const storage =
    options.storage === undefined ? getBrowserStorage() : options.storage;
  if (!storage) return null;

  const getCookie = options.getCookie ?? createCookieUtilities().getCookie;
  const cookieToken = getCookie("auth-token");
  if (cookieToken) {
    storage.removeItem("token");
    return cookieToken;
  }

  return storage.getItem("token");
}

function addHeader(
  config: AxiosRequestConfig,
  name: string,
  value: string,
): void {
  if (!config.headers) {
    config.headers = {};
  }
  config.headers[name] = value;
}

export class ApiClient {
  private readonly client: AxiosInstance;
  private readonly options: ApiClientOptions;

  constructor(options: ApiClientOptions = {}) {
    this.options = options;
    this.client =
      options.axiosInstance ??
      axios.create({
        baseURL: options.baseURL || DEFAULT_API_URL,
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

    this.client.interceptors.request.use(
      (config) => {
        const organizationSlug = this.options.getOrganizationSlug?.() ?? null;
        if (organizationSlug) {
          addHeader(config, "X-Organization", organizationSlug);
        }

        const propertyId = this.options.getPropertyId?.() ?? null;
        if (organizationSlug && propertyId) {
          addHeader(config, "X-Property", propertyId);
        }

        const token = this.options.getToken?.() ?? getStoredAuthToken();
        if (token) {
          addHeader(config, "Authorization", `Bearer ${token}`);
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await this.handleUnauthorized();
        }
        return Promise.reject(error);
      },
    );
  }

  private async handleUnauthorized(): Promise<void> {
    try {
      await this.options.onUnauthorized?.();
    } finally {
      this.clearToken();

      const location =
        this.options.getLocation?.() ??
        (typeof window === "undefined" ? null : window.location);
      if (!location) return;

      const currentPath = location.pathname + location.search + location.hash;
      const loginUrl = new URL("/auth/login", location.origin);
      const onAuthRoute = location.pathname.startsWith("/auth");

      if (!onAuthRoute && currentPath) {
        loginUrl.searchParams.set("redirect_to", currentPath);
      } else if (onAuthRoute) {
        const existingRedirect = new URL(location.href).searchParams.get(
          "redirect_to",
        );
        if (existingRedirect) {
          loginUrl.searchParams.set("redirect_to", existingRedirect);
        }
      }

      const loginHref = loginUrl.toString();
      if (this.options.navigate) {
        this.options.navigate(loginHref);
      } else if (typeof window !== "undefined") {
        window.location.href = loginHref;
      }
    }
  }

  public setToken(token: string): void {
    const storage = getBrowserStorage();
    if (storage) storage.setItem("token", token);
  }

  public clearToken(): void {
    const storage = getBrowserStorage();
    if (!storage) return;
    storage.removeItem("token");
    storage.removeItem("user");
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  return new ApiClient(options);
}
