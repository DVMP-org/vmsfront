import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SelectPage from "./page";

vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/hooks/use-email-verification-guard", () => ({
  useRequireEmailVerification: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      items: [
        {
          id: "organization",
          parent_id: null,
          name: "Harbour Estate",
          slug: "harbour-estate",
          kind: "site",
          address: "1 Harbour Way",
          use_case: "mixed_use",
          is_active: true,
        },
      ],
    },
    isPending: false,
  }),
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
vi.mock("@/hooks/use-admin", () => ({
  useAdminProfile: () => ({
    data: { role: { name: "Super Admin" } },
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/hooks/use-auth", () => ({
  useVerifyToken: () => ({
    data: {
      user: { email: "alex@example.com", name: "Alex Morgan" },
      party: { display_name: "Alex Morgan", email: "alex@example.com" },
      workspaces: [
        {
          id: "admin",
          organization_id: "org",
          role: "admin",
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
            id: "organization",
            name: "Harbour Estate",
            slug: "harbour-estate",
            kind: "site",
            is_active: true,
          },
        },
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
    render(<SelectPage />);
    expect(
      screen.getByRole("heading", { name: "Your workspaces" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Properties" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Management console/ }),
    ).toHaveTextContent("Super administrator");
    expect(screen.getByText("1 Harbour Way")).toBeInTheDocument();
    expect(screen.getByText("Guest stay")).toBeInTheDocument();
    expect(screen.getByText("Harbour Hotel")).toBeInTheDocument();
    expect(screen.getByText("Apartment A-101")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Book stay/i })).toBeNull();
  });
});
