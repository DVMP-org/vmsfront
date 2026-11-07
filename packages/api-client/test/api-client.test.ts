import axios from "axios";
import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";

import { createApiClient, getStoredAuthToken, parseApiError } from "../src";

describe("@vms/api-client", () => {
  it("prefers the shared auth cookie over the legacy local token", () => {
    const removed: string[] = [];
    const storage = {
      getItem: (key: string) => (key === "token" ? "legacy-token" : null),
      removeItem: (key: string) => removed.push(key),
    };

    expect(
      getStoredAuthToken({
        getCookie: () => "shared-token",
        storage,
      }),
    ).toBe("shared-token");
    expect(removed).toEqual(["token"]);
  });

  it("sends tenant and selected property context on API requests", async () => {
    let requestHeaders: Record<string, unknown> = {};
    const http = axios.create();
    http.defaults.adapter = async (config) => {
      requestHeaders = config.headers.toJSON();
      return {
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    const client = createApiClient({
      axiosInstance: http,
      getToken: () => "session-token",
      getOrganizationSlug: () => "acme",
      getPropertyId: () => "property-1",
    });

    await expect(client.get("/api/properties")).resolves.toEqual({ ok: true });
    expect(requestHeaders).toMatchObject({
      Authorization: "Bearer session-token",
      "X-Organization": "acme",
      "X-Property": "property-1",
    });
  });

  it("does not send property context on the base domain", async () => {
    let requestHeaders: Record<string, unknown> = {};
    const http = axios.create();
    http.defaults.adapter = async (config) => {
      requestHeaders = config.headers.toJSON();
      return {
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    const client = createApiClient({
      axiosInstance: http,
      getOrganizationSlug: () => null,
      getPropertyId: () => "stale-property",
    });

    await client.get("/api/organizations");
    expect(requestHeaders).not.toHaveProperty("X-Organization");
    expect(requestHeaders).not.toHaveProperty("X-Property");
  });

  it("clears the session and preserves the current path on 401", async () => {
    const onUnauthorized = vi.fn();
    const navigate = vi.fn();
    const http = axios.create();
    http.defaults.adapter = async (config) => {
      throw new AxiosError(
        "Request failed with status code 401",
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        {
          data: { detail: "expired" },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        },
      );
    };

    const client = createApiClient({
      axiosInstance: http,
      onUnauthorized,
      navigate,
      getLocation: () => ({
        href: "https://acme.vmsfront.to/admin/properties?view=active",
        origin: "https://acme.vmsfront.to",
        pathname: "/admin/properties",
        search: "?view=active",
        hash: "",
      }),
    });

    await expect(client.get("/api/properties")).rejects.toBeInstanceOf(
      AxiosError,
    );
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      "https://acme.vmsfront.to/auth/login?redirect_to=%2Fadmin%2Fproperties%3Fview%3Dactive",
    );
  });

  it("preserves FastAPI details, field errors and custom errors", () => {
    const error = new AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        data: {
          detail: [
            { loc: ["body", "email"], msg: "Enter a valid email" },
            { loc: ["query", "page"], msg: "Must be positive" },
          ],
          errors: { slug: ["Already exists"], name: "Required" },
        },
        status: 422,
        statusText: "Unprocessable Entity",
        headers: {},
        config: { headers: {} } as never,
      },
    );

    expect(parseApiError(error)).toEqual({
      message: "Request failed",
      fieldErrors: {
        email: "Enter a valid email",
        page: "Must be positive",
        slug: "Already exists",
        name: "Required",
      },
    });
  });
});
