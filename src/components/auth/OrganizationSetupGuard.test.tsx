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

  it("forces an organization without a Site into first-Site setup", async () => {
    render(
      <OrganizationSetupGuard>
        <p>Admin dashboard</p>
      </OrganizationSetupGuard>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/setup/first-site"),
    );
    expect(screen.queryByText("Admin dashboard")).toBeNull();
  });

  it("allows the first-Site creation route", () => {
    mocks.pathname = "/setup/first-site/";
    render(
      <OrganizationSetupGuard>
        <p>Create first Site</p>
      </OrganizationSetupGuard>,
    );

    expect(screen.getByText("Create first Site")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("does not block an organization that already has a Site", () => {
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
