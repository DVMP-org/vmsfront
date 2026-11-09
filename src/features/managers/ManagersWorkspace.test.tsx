import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ManagersWorkspace } from "./ManagersWorkspace";
import { managersApi } from "./api";

const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  selectedSite: { id: "site-1", name: "Harbour Estate" } as {
    id: string;
    name: string;
  } | null,
}));

vi.mock("@/store/app-store", () => {
  const state = {
    organization: {
      id: "org-1",
      name: "Harbour",
      slug: "harbour",
      created_at: "",
      updated_at: "",
      subscription: null,
    },
    get selectedProperty() {
      return mocks.selectedSite;
    },
  };
  return {
    useAppStore: (selector: (value: typeof state) => unknown) =>
      selector(state),
  };
});

vi.mock("@/store/auth-store", () => {
  const state = {
    user: { id: "user-1", email: "owner@example.test" },
    token: "token",
    _hasHydrated: true,
    isAuthenticated: true,
  };
  return {
    useAuthStore: (selector?: (value: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
}));

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return {
    ...actual,
    managersApi: {
      list: vi.fn(),
      roles: vi.fn(),
      add: vi.fn(),
      replaceRoles: vi.fn(),
      remove: vi.fn(),
    },
  };
});

function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })
      }
    >
      <ManagersWorkspace />
    </QueryClientProvider>,
  );
}

describe("Site managers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectedSite = { id: "site-1", name: "Harbour Estate" };
    mocks.profile.mockResolvedValue({
      data: { effective_permissions: ["*"] },
    });
    vi.mocked(managersApi.list).mockResolvedValue({
      site: {
        id: "site-1",
        organization_id: "org-1",
        parent_site_id: null,
        name: "Harbour Estate",
        slug: "harbour-estate",
        use_case: "residential",
        description: null,
        address: "",
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      effective_use_case: "residential",
      managers: [
        {
          assignment_id: "site-admin-1",
          user: {
            id: "user-1",
            name: "Dana Manager",
            email: "dana@example.test",
            is_active: true,
          },
          role: "site_admin",
          status: "active",
          roles: [
            {
              id: "role-1",
              name: "Site administrator",
              code: "site_admin",
              permissions: ["*"],
            },
          ],
          effective_permissions: ["*"],
        },
      ],
    });
    vi.mocked(managersApi.roles).mockResolvedValue({
      items: [
        {
          id: "role-1",
          name: "Site administrator",
          code: "site_admin",
          description: "Full Site authority",
          permissions: ["*"],
        },
      ],
      total: 1,
      page: 1,
      page_size: 100,
      total_pages: 1,
    });
  });

  it("lists Site managers independently from Place Parties", async () => {
    mount();

    expect((await screen.findAllByText("Dana Manager")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Full Site authority")).toBeVisible();
    expect(screen.getByRole("link", { name: "View parties" })).toHaveAttribute(
      "href",
      "/admin/people",
    );
    expect(screen.queryByText("Party role")).not.toBeInTheDocument();
  });

  it("does not render the manager list without a Site context", () => {
    mocks.selectedSite = null;
    vi.mocked(managersApi.list).mockClear();
    mount();
    expect(screen.getByText("Select a Site workspace")).toBeVisible();
    expect(managersApi.list).not.toHaveBeenCalled();
  });
});
