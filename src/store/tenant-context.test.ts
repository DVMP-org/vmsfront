import { beforeEach, describe, expect, it } from "vitest";

import { getCookie } from "@/lib/cookies";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

beforeEach(() => {
  document.cookie =
    "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie =
    "selected-organization=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  localStorage.clear();
  useAppStore.setState({
    organization: null,
    selectedResidency: null,
    branding: null,
  });
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    _hasHydrated: true,
  });
});

describe("tenant session cleanup", () => {
  it("clears persisted organization state when authentication ends", () => {
    useAppStore.setState({
      organization: {
        id: "org-acme",
        name: "Acme",
        slug: "acme",
        created_at: "2026-11-06T00:00:00Z",
        updated_at: "2026-11-06T00:00:00Z",
        subscription: null,
      },
      selectedResidency: null,
      branding: null,
    });
    document.cookie = "selected-organization=acme; path=/";
    localStorage.setItem("app-storage", '{"state":{"organization":{}}}');
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "user@example.test",
        first_name: "Test",
        last_name: "User",
      } as never,
      token: "token",
      isAuthenticated: true,
    });

    useAuthStore.getState().clearAuth();

    expect(getCookie("selected-organization")).toBeNull();
    expect(useAppStore.getState().organization).toBeNull();
    expect(JSON.parse(localStorage.getItem("app-storage") || "{}")).toMatchObject(
      {
        state: {
          organization: null,
          selectedResidency: null,
          branding: null,
        },
      },
    );
  });
});
