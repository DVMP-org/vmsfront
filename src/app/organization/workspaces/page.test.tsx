import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceDirectoryPage } from "@/features/workspaces/WorkspaceDirectoryPage";

vi.mock("@/hooks/use-email-verification-guard", () => ({
  useRequireEmailVerification: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      organization: {
        id: "org",
        name: "Harbour Estate",
        use_case: "mixed_use",
      },
      setSelectedProperty: vi.fn(),
    }),
}));
vi.mock("@/hooks/use-auth", () => ({
  useVerifyToken: () => ({
    data: {
      user: { email: "alex@example.com", name: "Alex Morgan" },
      party: { display_name: "Alex Morgan", email: "alex@example.com" },
      site_workspaces: [
        {
          assignment_id: "site-admin",
          role: "site_admin",
          site: {
            id: "organization",
            organization_id: "org",
            parent_site_id: null,
            name: "Harbour Estate",
            slug: "harbour-estate",
            use_case: "mixed_use",
            description: null,
            address: "1 Harbour Way",
            is_active: true,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
          effective_permissions: ["*"],
        },
      ],
      workspaces: [
        {
          id: "resident",
          organization_id: "org",
          role: "resident",
          status: "active",
          effective_from: null,
          effective_to: null,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          party: {
            id: "party",
            kind: "person",
            display_name: "Alex Morgan",
            email: "alex@example.com",
            is_active: true,
          },
          place: {
            id: "home",
            name: "Apartment A-101",
            slug: "apartment-a-101",
            kind: "unit",
            parent_id: "organization",
            is_active: true,
          },
        },
        {
          id: "guest",
          organization_id: "org",
          role: "guest_of",
          status: "active",
          effective_from: null,
          effective_to: null,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          party: {
            id: "party",
            kind: "person",
            display_name: "Alex Morgan",
            email: "alex@example.com",
            is_active: true,
          },
          place: {
            id: "hotel",
            name: "Harbour Hotel",
            slug: "harbour-hotel",
            kind: "building",
            is_active: true,
          },
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("workspaces page", () => {
  it("groups management, occupancy, and guest access by property", () => {
    render(<WorkspaceDirectoryPage />);
    expect(
      screen.getByRole("heading", { name: "Choose your workspace" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Organization settings" }),
    ).toBeNull();
    expect(
      screen.getAllByRole("link", { name: "Organization home" }),
    ).not.toHaveLength(0);
    for (const link of screen.getAllByRole("link", {
      name: "Organization home",
    })) {
      expect(link).toHaveAttribute("href", "/organization");
    }
    expect(
      screen.getByRole("heading", { name: /Properties \(3\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Management console/ }),
    ).toHaveTextContent("Site Administrator");
    expect(screen.getAllByText("Harbour Estate").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Apartment A-101/ }));
    expect(
      screen.getByRole("heading", {
        name: "Apartment A-101",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Resident workspace")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Harbour Hotel/ }));
    expect(screen.getByText("Guest stay")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Harbour Hotel" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Book stay/i })).toBeNull();
  });
});
