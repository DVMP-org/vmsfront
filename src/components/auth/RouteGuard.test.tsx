import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RouteGuard } from "./RouteGuard";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  hydrated: false,
  authenticated: false,
  pathname: "/admin",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: () => ({
    isAuthenticated: mocks.authenticated,
    token: mocks.authenticated ? "token" : null,
    user: null,
    _hasHydrated: mocks.hydrated,
  }),
}));

describe("RouteGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hydrated = false;
    mocks.authenticated = false;
    mocks.pathname = "/admin";
  });

  it("does not block the route behind a session verification screen", () => {
    render(
      <RouteGuard>
        <p>Operations shell</p>
      </RouteGuard>,
    );

    expect(screen.getByText("Operations shell")).toBeInTheDocument();
    expect(screen.queryByText(/verifying session/i)).toBeNull();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirects only after the client store hydrates without credentials", async () => {
    mocks.hydrated = true;
    render(
      <RouteGuard>
        <p>Operations shell</p>
      </RouteGuard>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        "/auth/login?redirect_to=%2Fadmin",
      ),
    );
  });
});
