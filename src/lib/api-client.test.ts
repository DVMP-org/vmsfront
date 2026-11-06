import { beforeEach, describe, expect, it } from "vitest";

import { getStoredAuthToken } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

describe("cross-subdomain authentication", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie =
      "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: true,
    });
  });

  it("prefers the shared cookie over a stale subdomain token", () => {
    document.cookie = "auth-token=shared-token; path=/";
    localStorage.setItem("token", "stale-subdomain-token");

    expect(getStoredAuthToken()).toBe("shared-token");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("falls back to the legacy local token when no shared cookie exists", () => {
    localStorage.setItem("token", "legacy-token");

    expect(getStoredAuthToken()).toBe("legacy-token");
  });

  it("replaces persisted state when the shared cookie belongs to another session", () => {
    document.cookie = "auth-token=current-token; path=/";
    useAuthStore.setState({
      user: {
        id: "stale-user",
        email: "stale@example.test",
        first_name: "Stale",
        last_name: "User",
      } as any,
      token: "stale-token",
      isAuthenticated: true,
    });

    useAuthStore.getState().syncFromCookie();

    expect(useAuthStore.getState()).toMatchObject({
      token: "current-token",
      user: null,
      isAuthenticated: true,
    });
  });
});
