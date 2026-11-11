import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FirstPlaceSetupPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => null,
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
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
    selector({ setSelectedProperty: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

describe("first-place onboarding", () => {
  it("renders as an isolated setup page after the plan", () => {
    render(<FirstPlaceSetupPage />);

    expect(
      screen.getByRole("heading", { name: "Create your first Site" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Organization setup progress" }),
    ).toHaveTextContent("First place");
    expect(screen.getByText("Back to plan")).toBeInTheDocument();
    expect(screen.getByLabelText(/Site name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Operating type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Administrator email/)).toBeInTheDocument();
    expect(screen.queryByText("Property directory")).toBeNull();
  });
});
