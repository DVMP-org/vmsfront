import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateOrganizationPage from "./page";

const mocks = vi.hoisted(() => ({
  createOrganization: vi.fn(),
  checkSlug: vi.fn(),
}));

vi.mock("@/components/layout/Header", () => ({ Header: () => null }));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      use_cases: [
        { value: "mixed_use", label: "Mixed use" },
        { value: "hospitality", label: "Hospitality" },
      ],
    },
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-organization", () => ({
  generateSlugFromName: (value: string) =>
    value.toLowerCase().trim().replaceAll(/\s+/g, "-"),
  useCreateOrganization: () => ({
    createOrganization: mocks.createOrganization,
    isLoading: false,
    error: null,
    fieldErrors: {},
  }),
  useCheckSlugAvailability: () => ({
    checkSlug: mocks.checkSlug,
    isChecking: false,
  }),
}));

describe("CreateOrganizationPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.createOrganization.mockReset();
    mocks.checkSlug.mockReset();
    mocks.checkSlug.mockResolvedValue(true);
  });

  it("restores an unfinished organization draft", () => {
    window.localStorage.setItem(
      "organization-create-draft-v1",
      JSON.stringify({
        name: "Harbour Operations",
        slug: "harbour-operations",
        description: "Mixed-use estate operations",
        slugManuallyEdited: true,
      }),
    );

    render(<CreateOrganizationPage />);

    expect(
      screen.getByText("Draft restored from this browser."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Organization name")).toHaveValue(
      "Harbour Operations",
    );
    expect(screen.getByLabelText("Workspace URL")).toHaveValue(
      "harbour-operations",
    );
  });

  it("creates the organization and explains the next setup steps", () => {
    render(<CreateOrganizationPage />);

    fireEvent.change(screen.getByLabelText("Organization name"), {
      target: { value: "Harbour Hotel Group" },
    });
    fireEvent.change(screen.getByLabelText("Description (optional)"), {
      target: { value: "Hotel operations" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to plan" }));

    expect(mocks.createOrganization).toHaveBeenCalledWith({
      name: "Harbour Hotel Group",
      slug: "harbour-hotel-group",
      description: "Hotel operations",
    });
    expect(screen.getAllByText("Plan").length).toBeGreaterThan(0);
    expect(screen.getByText("First workspace")).toBeInTheDocument();
  });

  it("explains an unavailable workspace URL immediately", async () => {
    mocks.checkSlug.mockResolvedValue(false);
    render(<CreateOrganizationPage />);

    fireEvent.change(screen.getByLabelText("Organization name"), {
      target: { value: "Existing Estate" },
    });

    expect(
      await screen.findByText(
        "This workspace URL is already in use. Choose a different URL.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to plan" }),
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Workspace URL"), {
      target: { value: "new-estate" },
    });
    mocks.checkSlug.mockResolvedValue(true);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Continue to plan" }),
      ).toBeEnabled(),
    );
    expect(
      screen.queryByText(
        "This workspace URL is already in use. Choose a different URL.",
      ),
    ).toBeNull();
  });
});
