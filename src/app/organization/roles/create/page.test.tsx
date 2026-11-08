import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoleDraftPage from "./page";

const mocks = vi.hoisted(() => ({
  roles: vi.fn(),
  permissions: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/organization/roles/create",
  useSearchParams: () => mocks.params,
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminRoles: mocks.roles,
  useAdminPermissions: mocks.permissions,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = new URLSearchParams();
  mocks.roles.mockReturnValue({
    data: { items: [], total: 0, total_pages: 0, page: 1 },
    isError: false,
  });
  mocks.permissions.mockReturnValue({
    data: { places: ["list", "create"], admins: ["list"] },
    isPending: false,
    isError: false,
  });
});

describe("role draft authoring", () => {
  it("states that no role changes are persisted", () => {
    render(<RoleDraftPage />);
    expect(screen.getByText("No changes are saved")).toBeInTheDocument();
    expect(
      screen.getByText(/Backend role mutation remains deferred/i),
    ).toBeInTheDocument();
  });

  it("validates identity and permission selection before previewing", () => {
    render(<RoleDraftPage />);
    fireEvent.click(screen.getByRole("button", { name: "Preview draft" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "Enter a role name.",
    );
    expect(
      screen.queryByRole("dialog", { name: "Role draft preview" }),
    ).not.toBeInTheDocument();
  });

  it("builds an in-memory permission draft without issuing a mutation", () => {
    render(<RoleDraftPage />);
    fireEvent.change(screen.getByLabelText(/Role name/), {
      target: { value: "Portfolio reviewer" },
    });
    fireEvent.change(screen.getByLabelText(/Role code/), {
      target: { value: "portfolio_reviewer" },
    });
    fireEvent.click(screen.getAllByLabelText("list")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Preview draft" }));
    expect(
      screen.getByRole("dialog", { name: "Role draft preview" }),
    ).toHaveTextContent("Portfolio reviewer");
    expect(
      screen.getByText(/Nothing has been persisted/i),
    ).toBeInTheDocument();
  });
});
