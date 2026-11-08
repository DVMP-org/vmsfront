import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

vi.mock("@/hooks/use-organization", () => ({
  useCurrentOrganization: () => ({
    organization: {
      id: "org-current",
      slug: "harbour",
      name: "Harbour Estate",
      logo_url: null,
    },
  }),
  useMyOrganizations: () => ({
    data: [
      {
        id: "org-current",
        slug: "harbour",
        name: "Harbour Estate",
        logo_url: null,
      },
      {
        id: "org-other",
        slug: "harbour-offices",
        name: "Harbour Offices",
        logo_url: null,
      },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/lib/subdomain-utils", () => ({
  buildSubdomainUrl: (slug: string, path: string) =>
    `https://${slug}.vmsfront.to${path}`,
}));

describe("OrganizationSwitcher", () => {
  it("keeps organization switching in the global switcher only", () => {
    render(<OrganizationSwitcher />);

    const trigger = screen.getByRole("button", {
      name: /Harbour Estate harbour/i,
    });
    fireEvent.click(trigger);

    expect(screen.getByText("Current organization")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Harbour Offices/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /All organizations/i }),
    ).toHaveAttribute("href", "/organizations");
    expect(screen.queryByText("Organization settings")).toBeNull();
  });

  it("closes the Organization menu with Escape", () => {
    render(<OrganizationSwitcher />);
    fireEvent.click(
      screen.getByRole("button", { name: /Harbour Estate harbour/i }),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Current organization")).toBeNull();
  });
});
