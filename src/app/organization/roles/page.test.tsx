import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrganizationRolesPage from "./page";

const mocks = vi.hoisted(() => ({ roles: vi.fn() }));

vi.mock("@/hooks/use-admin", () => ({
  useAdminRoles: mocks.roles,
}));

const role = {
  id: "role-1",
  name: "Operations lead",
  code: "operations_lead",
  description: "Coordinates Site operations",
  permissions: ["places.list"],
  permissions_parsed: ["places.list"],
  created_at: "2026-11-08T00:00:00Z",
  updated_at: "2026-11-08T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.roles.mockReturnValue({
    data: { items: [role], total: 1, total_pages: 1, page: 1 },
    isPending: false,
    isError: false,
  });
});

describe("organization role prototype", () => {
  it("labels role authoring as non-persistent and links to the draft page", () => {
    render(<OrganizationRolesPage />);
    expect(screen.getByText("Authoring prototype")).toBeInTheDocument();
    expect(
      screen.getByText(/drafts are not saved and existing roles are not changed/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create draft role" }),
    ).toHaveAttribute("href", "/organization/roles/create");
    expect(
      screen.getByRole("link", { name: /Inspect draft/ }),
    ).toHaveAttribute(
      "href",
      `/organization/roles/create?role=${role.id}`,
    );
  });
});
