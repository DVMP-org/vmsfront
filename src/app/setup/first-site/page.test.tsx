import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FirstSiteSetupPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => null,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      use_cases: [
        { value: "residential", label: "Residential" },
        { value: "mixed_use", label: "Mixed use" },
      ],
    },
    isError: false,
    refetch: vi.fn(),
  }),
  useQueryClient: () => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/features/organization-workspace/queries", () => ({
  useCreateOrganizationSite: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

vi.mock("@/hooks/use-organization", () => ({
  useCurrentOrganization: () => ({
    organization: {
      id: "org",
      name: "Harbour Operations",
      slug: "harbour",
      needs_first_site: true,
    },
    currentSlug: "harbour",
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ setSelectedSite: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

describe("first-site onboarding", () => {
  it("renders as an isolated setup page after the plan", () => {
    render(<FirstSiteSetupPage />);

    expect(
      screen.getByRole("heading", { name: "Create your first Site" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Organization setup progress" }),
    ).toHaveTextContent("First Site");
    expect(screen.getByText("Back to plan")).toBeInTheDocument();
    expect(screen.getByLabelText(/Site name/)).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: /Operating type/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Administrator email/)).toBeInTheDocument();
    expect(screen.queryByText("Property directory")).toBeNull();
  });
});
