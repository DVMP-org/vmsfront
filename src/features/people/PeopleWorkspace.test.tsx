import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PeopleWorkspace from "./PeopleWorkspace";
import { peopleApi } from "./api";

const mocks = vi.hoisted(() => ({
  profileData: {
    effective_permissions: [] as string[],
  },
  setSelectedProperty: vi.fn(),
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
    selectedProperty: mocks.selectedSite,
    setSelectedProperty: mocks.setSelectedProperty,
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

vi.mock("@/features/context/use-site-access", () => ({
  useSiteAccess: () => ({
    workspace: {
      data: mocks.profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
      isFetchedAfterMount: true,
      refetch: vi.fn(),
    },
    contextKey: "org-1:site-1:user-1",
    allowed: (requirement: string | string[]) => {
      const checks = Array.isArray(requirement) ? requirement : [requirement];
      return checks.some((permission) =>
        mocks.profileData.effective_permissions.includes(permission),
      );
    },
  }),
}));

vi.mock("@/features/access-credentials/AccessCredentialDialog", () => ({
  AccessCredentialDialog: () => null,
}));

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return {
    ...actual,
    peopleApi: {
      get: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
    },
  };
});

vi.mock("@/components/sites/PlacePicker", () => ({
  PlacePicker: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: unknown;
    onChange: (item: unknown) => void;
  }) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={value ? value.id : ""}
        onChange={() =>
          onChange({
            id: "place-1",
            name: "Apartment 4B",
          })
        }
      >
        <option value="">Choose</option>
        <option value="place-1">Apartment 4B</option>
      </select>
    </label>
  ),
}));
vi.mock("@/components/sites/SitePicker", () => ({
  SitePicker: () => null,
}));

const tenant = {
  assignment_id: "relationship-1",
  party: {
    id: "party-1",
    kind: "person",
    display_name: "Ada Tenant",
    email: "ada@example.test",
    is_active: true,
  },
  role: "resident",
  is_super_admin: false,
  status: "active",
  place: {
    id: "place-1",
    name: "Apartment 4B",
    slug: "apartment-4b",
    kind: "unit",
    is_active: true,
    site_name: "Harbour Estate",
  },
};

function mount() {
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
      <PeopleWorkspace />
    </QueryClientProvider>,
  );
}

describe("Site People", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectedSite = { id: "site-1", name: "Harbour Estate" };
    mocks.profileData = {
      effective_permissions: [
        "parties.create",
        "parties.list",
        "place_relationships.create",
      ],
    };
    vi.mocked(peopleApi.get).mockResolvedValue({
      site: {
        id: "site-1",
        organization_id: "org-1",
        parent_site_id: null,
        name: "Harbour Estate",
        slug: "harbour-estate",
        use_case: "residential",
        description: null,
        address: "1 Harbour Way",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      effective_use_case: "residential",
      people: [tenant],
    });
    vi.mocked(peopleApi.add).mockResolvedValue({
      assignment_id: "relationship-2",
      role: "resident",
      status: "active",
      party: {
        ...tenant.party,
        organization_id: "org-1",
        user_id: "user-2",
        legal_name: null,
        phone: null,
        created_at: "",
        updated_at: "",
      },
      place: tenant.place,
      onboarding_email: "queued",
      user_created: true,
    });
    vi.mocked(peopleApi.remove).mockResolvedValue({
      assignment_id: "relationship-1",
      source: "occupancy",
      status: "ended",
    });
  });

  it("lists only Parties in the selected Site and links managers separately", async () => {
    mount();

    expect((await screen.findAllByText("Ada Tenant")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Apartment 4B")).toBeVisible();
    expect(screen.getByRole("link", { name: "Managers" })).toHaveAttribute(
      "href",
      "/admin/managers",
    );
    expect(peopleApi.get).toHaveBeenCalledWith("site-1");
  });

  it("adds a Party to an explicit Place in the Site", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Add party" }));

    fireEvent.change(screen.getByLabelText(/Full name/), {
      target: { value: "Tunde Resident" },
    });
    fireEvent.change(screen.getByLabelText(/Email address/), {
      target: { value: "tunde@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Choose a Place in this Site"), {
      target: { value: "place-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add and invite" }));

    await waitFor(() =>
      expect(peopleApi.add).toHaveBeenCalledWith(
        "site-1",
        expect.objectContaining({
          place_id: "place-1",
          display_name: "Tunde Resident",
          email: "tunde@example.test",
        }),
      ),
    );
  });

  it("ends an occupancy relationship without touching Site administration", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(peopleApi.remove).toHaveBeenCalledWith(
        "site-1",
        "occupancy",
        "relationship-1",
      ),
    );
  });
});
