import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarOrganizationHeader } from "./SidebarOrganizationHeader";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

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

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      user: { email: "operator@example.com" },
    }),
}));

describe("SidebarOrganizationHeader", () => {
  it("shows the active organization and available organization switch", () => {
    render(<SidebarOrganizationHeader onToggleCollapse={mocks.toggle} />);

    const trigger = screen.getByRole("button", {
      name: /Harbour Estate operator@example.com/i,
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Current organization")).toBeInTheDocument();
    expect(screen.getByText("Harbour Offices")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Add organization/i }));
    expect(mocks.push).toHaveBeenCalledWith("/organizations/new");
  });

  it("keeps a clear expand action in collapsed mode", () => {
    render(
      <SidebarOrganizationHeader collapsed onToggleCollapse={mocks.toggle} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(mocks.toggle).toHaveBeenCalledOnce();
  });
});
