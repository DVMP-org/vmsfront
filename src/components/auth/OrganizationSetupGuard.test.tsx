import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationSetupGuard } from "./OrganizationSetupGuard";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: "/admin",
  needsFirstSite: true,
  isPending: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/hooks/use-organization", () => ({
  useCurrentOrganization: () => ({
    organization: {
      id: "org",
      name: "Harbour",
      slug: "harbour",
      needs_first_site: mocks.needsFirstSite,
    },
    isPending: mocks.isPending,
  }),
}));

describe("OrganizationSetupGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pathname = "/admin";
    mocks.needsFirstSite = true;
    mocks.isPending = false;
  });

  it("forces an organization without a place into first-place setup", async () => {
    render(
      <OrganizationSetupGuard>
        <p>Admin dashboard</p>
      </OrganizationSetupGuard>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        "/admin/properties/new?setup=first-place",
      ),
    );
    expect(screen.queryByText("Admin dashboard")).toBeNull();
  });

  it("allows the first-place creation route", () => {
    mocks.pathname = "/admin/properties/new/";
    render(
      <OrganizationSetupGuard>
        <p>Create first place</p>
      </OrganizationSetupGuard>,
    );

    expect(screen.getByText("Create first place")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("does not block an organization that already has a place", () => {
    mocks.needsFirstSite = false;
    render(
      <OrganizationSetupGuard>
        <p>Admin dashboard</p>
      </OrganizationSetupGuard>,
    );

    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
