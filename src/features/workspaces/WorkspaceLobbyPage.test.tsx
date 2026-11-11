import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVerifyToken } from "@/hooks/use-auth";
import {
  useCurrentOrganization,
  useMyOrganizations,
} from "@/hooks/use-organization";
import { WorkspaceLobbyPage } from "./WorkspaceLobbyPage";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  setSelectedSite: vi.fn(),
  logout: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@/components/layout/WorkspaceLobbyHeader", () => ({
  WorkspaceLobbyHeader: () => <header aria-label="Lobby header" />,
}));
vi.mock("@/hooks/use-auth", () => ({
  useVerifyToken: vi.fn(),
  useAuth: () => ({ logout: mocks.logout }),
}));
vi.mock("@/hooks/use-email-verification-guard", () => ({
  useRequireEmailVerification: vi.fn(),
}));
vi.mock("@/hooks/use-organization", () => ({
  useCurrentOrganization: vi.fn(),
  useMyOrganizations: vi.fn(),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ setSelectedSite: mocks.setSelectedSite }),
}));

const organization = {
  id: "org-1",
  name: "Harbour Estate",
  slug: "harbour",
  use_case: "residential",
  subscription: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const admin = {
  id: "admin-1",
  user_id: "user",
  role_id: "role-1",
  permissions: "*",
  role: { id: "role-1", name: "Super Admin" },
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const siteWorkspace = {
  assignment_id: "assignment-1",
  role: "site_admin" as const,
  site: {
    id: "site-1",
    organization_id: "org-1",
    parent_site_id: null,
    name: "Pebble Court",
    slug: "pebble-court",
    use_case: "residential" as const,
    description: null,
    address: "1 Pebble Way",
    is_active: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  effective_permissions: ["places.list"],
};

const relationship = {
  id: "relationship-1",
  organization_id: "org-1",
  site_id: "site-1",
  role: "resident",
  status: "active",
  effective_from: null,
  effective_to: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  party: { id: "party-1", display_name: "Alex Morgan" },
  place: {
    id: "place-1",
    name: "APT 01",
    slug: "apt-01",
    kind: "unit",
    parent_id: "site-1",
    site_name: "Pebble Court",
    is_active: true,
    use_case: "residential",
  },
};

function context(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: "user", first_name: "Alex", last_name: "Morgan", email: "alex@example.com" },
    party: null,
    admin: null,
    workspaces: [],
    site_workspaces: [],
    ...overrides,
  };
}

function mockQuery(overrides: Record<string, unknown> = {}) {
  return {
    isPending: false,
    isSuccess: true,
    isError: false,
    data: context(),
    error: null,
    refetch: mocks.refetch,
    ...overrides,
  };
}

function mockOrganization(hasMultiple = false) {
  vi.mocked(useCurrentOrganization).mockReturnValue({
    organization,
  } as never);
  vi.mocked(useMyOrganizations).mockReturnValue({
    data: hasMultiple
      ? [organization, { ...organization, id: "org-2", name: "Second Org" }]
      : [organization],
  } as never);
}

describe("WorkspaceLobbyPage", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.setSelectedSite.mockReset();
    mocks.logout.mockReset();
    mocks.refetch.mockReset();
    window.history.replaceState({}, "", "/");
    mockOrganization();
  });

  it("lists organization, site and place destinations as separate workspaces", () => {
    vi.mocked(useVerifyToken).mockReturnValue(
      mockQuery({
        data: context({
          admin,
          site_workspaces: [siteWorkspace],
          workspaces: [relationship],
        }),
      }) as never,
    );

    render(<WorkspaceLobbyPage />);

    expect(
      screen.getByRole("heading", { name: "Choose your workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Continue where you have access within/)).toBeInTheDocument();
    expect(screen.getByText("Harbour Estate")).toBeInTheDocument();
    expect(screen.getByText("Organization administration")).toBeInTheDocument();
    expect(screen.getByText("Pebble Court")).toBeInTheDocument();
    expect(screen.getByText("Pebble Court - APT 01")).toBeInTheDocument();
  });

  it("does not render organization administration for a non-admin member", () => {
    vi.mocked(useVerifyToken).mockReturnValue(
      mockQuery({
        data: context({
          site_workspaces: [siteWorkspace],
          workspaces: [relationship],
        }),
      }) as never,
    );

    render(<WorkspaceLobbyPage />);

    expect(screen.queryByText("Organization administration")).toBeNull();
    expect(screen.getByText("Pebble Court")).toBeInTheDocument();
  });

  it("redirects a single authorized destination straight into its workspace", async () => {
    vi.mocked(useVerifyToken).mockReturnValue(
      mockQuery({ data: context({ workspaces: [relationship] }) }) as never,
    );

    render(<WorkspaceLobbyPage />);

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/workspace/place-1"),
    );
    expect(mocks.setSelectedSite).toHaveBeenCalledWith({
      id: "place-1",
      name: "Pebble Court - APT 01",
    });
  });

  it("keeps the picker visible when a lobby link is explicit", async () => {
    window.history.replaceState({}, "", "/?lobby=1");
    vi.mocked(useVerifyToken).mockReturnValue(
      mockQuery({ data: context({ workspaces: [relationship] }) }) as never,
    );

    render(<WorkspaceLobbyPage />);

    expect(
      screen.getByRole("heading", { name: "Choose your workspace" }),
    ).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("shows an access-required state when the user has no destinations", () => {
    vi.mocked(useVerifyToken).mockReturnValue(mockQuery() as never);

    render(<WorkspaceLobbyPage />);

    expect(screen.getByText("No workspace access yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Ask an organization administrator to grant access/),
    ).toBeInTheDocument();
  });

  it("shows the organization switcher only for multiple organizations", () => {
    mockOrganization(true);
    vi.mocked(useVerifyToken).mockReturnValue(
      mockQuery({
        data: context({
          site_workspaces: [siteWorkspace],
          workspaces: [relationship],
        }),
      }) as never,
    );

    render(<WorkspaceLobbyPage />);

    expect(
      screen.getByRole("link", { name: "Change organization" }),
    ).toHaveAttribute("href", "/organizations");
  });

  it("shows the error state and retries the workspace request", () => {
    vi.mocked(useVerifyToken).mockReturnValue(
      mockQuery({
        isSuccess: false,
        isError: true,
        data: undefined,
        error: new Error("Network unavailable"),
      }) as never,
    );

    render(<WorkspaceLobbyPage />);

    expect(
      screen.getByText("Your workspaces could not be loaded"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("signs out from the lobby footer", () => {
    vi.mocked(useVerifyToken).mockReturnValue(
      mockQuery({
        data: context({
          site_workspaces: [siteWorkspace],
          workspaces: [relationship],
        }),
      }) as never,
    );

    render(<WorkspaceLobbyPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(mocks.logout).toHaveBeenCalled();
  });
});
