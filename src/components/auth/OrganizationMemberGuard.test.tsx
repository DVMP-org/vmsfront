import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrganizationMemberGuard } from "./OrganizationMemberGuard";

vi.mock("@/hooks/use-organization", () => ({
  useCurrentOrganization: () => ({
    data: undefined,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
  }),
  useMyOrganizations: () => ({
    data: undefined,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("OrganizationMemberGuard", () => {
  it("uses one organization skeleton inside the persistent shell", () => {
    render(
      <OrganizationMemberGuard>
        <p>Organization content</p>
      </OrganizationMemberGuard>,
    );

    expect(
      screen.getByRole("status", { name: "Loading organization" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/verifying organization access/i)).toBeNull();
    expect(screen.queryByText("Organization content")).toBeNull();
  });
});
