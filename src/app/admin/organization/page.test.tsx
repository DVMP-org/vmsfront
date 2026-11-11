import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrganizationPage from "./page";

const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  organization: vi.fn(),
  update: vi.fn(),
  setOrganization: vi.fn(),
}));

vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
}));

vi.mock("@/features/context/api", () => ({
  contextApi: {
    organization: mocks.organization,
    updateOrganization: mocks.update,
  },
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: {
      organization: { id: string };
      setSelectedOrganization: typeof mocks.setOrganization;
    }) => unknown,
  ) =>
    selector({
      organization: { id: "org" },
      setSelectedOrganization: mocks.setOrganization,
    }),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "user" } }),
}));

const organization = {
  id: "org",
  name: "Harbour Estate",
  slug: "harbour-estate",
  description: "Mixed-use operations",
  created_at: "2026-01-01",
  updated_at: "2026-01-02",
  subscription: null,
};

function mount(permissions: string[]) {
  mocks.profile.mockResolvedValue({
    data: { effective_permissions: permissions },
  });
  mocks.organization.mockResolvedValue(organization);
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <OrganizationPage />
    </QueryClientProvider>,
  );
}

describe("organization settings page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("edits mutable details while keeping the slug fixed", async () => {
    const updated = { ...organization, name: "Harbour Group" };
    mocks.update.mockResolvedValue(updated);
    mount(["organizations.show", "organizations.update"]);

    const name = await screen.findByLabelText("Name");
    expect(screen.getByText("Sites")).toBeInTheDocument();
    expect(screen.getByText("harbour-estate")).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /operating use case/i }),
    ).toBeNull();
    fireEvent.change(name, { target: { value: "Harbour Group" } });
    fireEvent.click(screen.getByRole("button", { name: "Save organization" }));

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        name: "Harbour Group",
        description: "Mixed-use operations",
      }),
    );
    expect(mocks.setOrganization).toHaveBeenCalledWith(updated);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Organization saved",
    );
  });

  it("renders a read-only settings surface without update permission", async () => {
    mount(["organizations.show"]);
    expect(await screen.findByLabelText("Name")).toHaveValue("Harbour Estate");
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save organization" }),
    ).toBeNull();
  });

  it("fails closed without organization visibility", async () => {
    mount([]);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "do not have permission",
    );
    expect(mocks.organization).not.toHaveBeenCalled();
  });
});
