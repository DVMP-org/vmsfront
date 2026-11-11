import { beforeEach, describe, expect, it } from "vitest";

import { getCookie } from "@/lib/cookies";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

beforeEach(() => {
  document.cookie =
    "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie =
    "selected-organization=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie =
    "selected-site=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie =
    "selected-site-organization=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  localStorage.clear();
  useAppStore.setState({
    selectedSite: null,
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
    expect(
      JSON.parse(localStorage.getItem("app-storage") || "{}"),
    ).toMatchObject({
      state: {
        organization: null,
        selectedResidency: null,
        branding: null,
      },
    });
  });
});

const organization = (id: string) =>
  ({ id, slug: id, name: id }) as NonNullable<
    ReturnType<typeof useAppStore.getState>["organization"]
  >;

describe("Site selection persistence", () => {
  it("preserves a Site when the same organization is refreshed", () => {
    useAppStore.getState().setSelectedOrganization(organization("acme"));
    useAppStore
      .getState()
      .setSelectedSite({ id: "site-1", name: "Main Site" });
    useAppStore
      .getState()
      .setSelectedOrganization({ ...organization("acme"), name: "Updated" });
    expect(useAppStore.getState().selectedSite?.id).toBe("site-1");
    expect(getCookie("selected-site")).toBe("site-1");
    expect(getCookie("selected-site-organization")).toBe("acme");
  });

  it.each(["other", null])(
    "clears the Site and its cookie when leaving the organization (%s)",
    (id) => {
      useAppStore.getState().setSelectedOrganization(organization("acme"));
      useAppStore
        .getState()
        .setSelectedSite({ id: "site-1", name: "Main Site" });
      useAppStore
        .getState()
        .setSelectedOrganization(id ? organization(id) : null);
      expect(useAppStore.getState().selectedSite).toBeNull();
      expect(getCookie("selected-site")).toBeNull();
      expect(getCookie("selected-site-organization")).toBeNull();
    },
  );

  it("restores the Site through persistence rehydration", async () => {
    useAppStore.getState().setSelectedOrganization(organization("acme"));
    useAppStore
      .getState()
      .setSelectedSite({ id: "site-1", name: "Main Site" });
    const saved = localStorage.getItem("app-storage")!;
    useAppStore.setState({ organization: null, selectedSite: null });
    localStorage.setItem("app-storage", saved);
    await useAppStore.persist.rehydrate();
    useAppStore.getState().setSelectedOrganization(organization("acme"));
    expect(useAppStore.getState().selectedSite?.id).toBe("site-1");
  });

  it("removes Site hints on logout", () => {
    useAppStore.getState().setSelectedOrganization(organization("acme"));
    useAppStore
      .getState()
      .setSelectedSite({ id: "site-1", name: "Main Site" });
    useAuthStore.getState().clearAuth();
    expect(getCookie("selected-site")).toBeNull();
    expect(useAppStore.getState().selectedSite).toBeNull();
  });
});

describe("cookie identity synchronization", () => {
  it("keeps a hydrated profile when its token matches the cookie", () => {
    const user = { id: "user-1", email: "one@example.test" } as never;
    useAuthStore.getState().setAuth(user, "same-token");
    useAuthStore.getState().syncFromCookie();
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("discards a profile when the shared cookie changes identity", () => {
    useAuthStore.getState().setAuth({ id: "user-1" } as never, "old-token");
    document.cookie = "auth-token=new-token; path=/";
    useAuthStore.getState().syncFromCookie();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBe("new-token");
  });
});
