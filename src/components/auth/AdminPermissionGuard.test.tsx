import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPermissionGuard } from "./AdminPermissionGuard";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refetch: vi.fn(),
  isAdministrator: true,
  pending: false,
  error: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminProfile: () => ({
    data: { effective_permissions: ["*"] },
    isLoading: false,
  }),
}));

vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => ({
    data: {
      modules: ["dashboard"],
      management: { is_administrator: mocks.isAdministrator },
    },
    isPending: mocks.pending,
    isError: mocks.error,
    refetch: mocks.refetch,
  }),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "user" } }),
}));

describe("AdminPermissionGuard management boundary", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.refetch.mockReset();
    mocks.isAdministrator = true;
    mocks.pending = false;
    mocks.error = false;
  });

  it("opens management only with authority for the selected place", () => {
    render(
      <AdminPermissionGuard>
        <div>Property operations</div>
      </AdminPermissionGuard>,
    );

    expect(screen.getByText("Property operations")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirects an organization-only entry to Workspaces with an explanation", async () => {
    mocks.isAdministrator = false;
    render(
      <AdminPermissionGuard>
        <div>Property operations</div>
      </AdminPermissionGuard>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        "/select?reason=management-required",
      ),
    );
    expect(screen.queryByText("Property operations")).toBeNull();
  });

  it("does not make a management decision while context is pending", () => {
    mocks.pending = true;
    render(
      <AdminPermissionGuard>
        <div>Property operations</div>
      </AdminPermissionGuard>,
    );

    expect(screen.queryByText("Property operations")).toBeNull();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
