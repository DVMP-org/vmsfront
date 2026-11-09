import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";
import { sitesApi } from "@/features/sites/api";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
  profile: vi.fn(),
  setSelectedProperty: vi.fn(),
  organization: {
    id: "org-1",
    name: "Harbour",
    slug: "harbour",
    use_case: "residential",
    created_at: "",
    updated_at: "",
    subscription: null,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
  usePathname: () => "/admin/properties",
}));

vi.mock("@/store/app-store", () => {
  const state = {
    organization: mocks.organization,
    selectedProperty: null,
    setSelectedProperty: mocks.setSelectedProperty,
  };
  const useAppStore = (selector: (value: typeof state) => unknown) =>
    selector(state);
  useAppStore.getState = () => state;
  return { useAppStore };
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

vi.mock("@/features/sites/api", () => ({
  sitesApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    move: vi.fn(),
    toggle: vi.fn(),
    createPlace: vi.fn(),
  },
}));

const site = {
  id: "site-1",
  organization_id: "org-1",
  parent_site_id: null,
  name: "Harbour Estate",
  slug: "harbour-estate",
  use_case: "residential" as const,
  description: "Primary residential Site",
  address: "1 Harbour Way",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const childSite = {
  ...site,
  id: "site-child",
  parent_site_id: "site-1",
  name: "Harbour Annex",
  slug: "harbour-annex",
};

const place = {
  id: "place-1",
  site_id: "site-1",
  organization_id: "org-1",
  parent_id: null,
  name: "Block A",
  slug: "block-a",
  kind: "building" as const,
  building_type: "apartment_block",
  use_case: "residential" as const,
  description: null,
  address: "1 Harbour Way",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function mount(route = {}) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <PropertiesWorkspace route={route} />
    </QueryClientProvider>,
  );
}

describe("organization Site register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profile.mockResolvedValue({
      data: { effective_permissions: ["*"] },
    });
    vi.mocked(sitesApi.list).mockResolvedValue({
      items: [site],
      total: 1,
      page: 1,
      page_size: 10,
      total_pages: 1,
    });
    vi.mocked(sitesApi.get).mockResolvedValue({
      ...site,
      ancestors: [],
      child_sites: [childSite],
      places: [place],
    });
    vi.mocked(sitesApi.create).mockResolvedValue({
      ...site,
      site_admin: {
        assignment_id: "site-admin-1",
        user: {
          id: "user-1",
          name: "Site Administrator",
          email: "manager@example.test",
          is_active: true,
        },
        role: "site_admin",
        status: "active",
        roles: [],
        effective_permissions: ["*"],
      },
      onboarding_email: "queued",
      user_created: true,
    });
  });

  it("shows only the organization Site register in organization context", async () => {
    mount();

    expect(
      await screen.findByRole("heading", { name: "Properties" }),
    ).toBeVisible();
    expect(
      (await screen.findAllByText("Harbour Estate")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Organization overview")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Site" })).toBeVisible();
    expect(sitesApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ root_only: true, page: 1 }),
    );
  });

  it("shows direct child Sites and Places without a hierarchy diagram", async () => {
    mount({ id: "site-1" });

    expect(
      await screen.findByRole("heading", { name: "Harbour Estate" }),
    ).toBeVisible();
    expect(screen.getByText("Harbour Annex")).toBeVisible();
    expect(screen.getAllByText("Block A").length).toBeGreaterThan(0);
    expect(screen.queryByText(/diagram/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /open workspace/i }),
    ).not.toBeInTheDocument();
  });

  it("creates a Site from the organization route and opens its detail", async () => {
    mount({ action: "new" });

    fireEvent.change(await screen.findByLabelText(/Site name/), {
      target: { value: "Riverside Campus" },
    });
    fireEvent.change(screen.getByLabelText(/Administrator email/), {
      target: { value: "manager@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Site" }));

    await waitFor(() =>
      expect(sitesApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Riverside Campus",
          admin_email: "manager@example.test",
          parent_site_id: null,
        }),
      ),
    );
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/admin/properties/site-1"),
    );
  });

  it("shows a recoverable failure when Sites cannot load", async () => {
    vi.mocked(sitesApi.list).mockRejectedValueOnce(new Error("Network down"));
    mount();
    expect(await screen.findByText("Sites could not be loaded")).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();
  });
});
