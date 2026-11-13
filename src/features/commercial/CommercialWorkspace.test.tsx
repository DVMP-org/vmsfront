import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import CommercialInventory from "./CommercialInventory";
import CommercialOverview from "./CommercialOverview";
import CommercialTenants from "./CommercialTenants";

const mocks = vi.hoisted(() => ({
  tree: vi.fn(),
  relationships: vi.fn(),
  assignment: vi.fn(),
  maintenance: vi.fn(),
  createRelationship: vi.fn(),
  createMaintenance: vi.fn(),
  updateMaintenance: vi.fn(),
  invitations: vi.fn(),
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
  moveProperty: vi.fn(),
  toggleProperty: vi.fn(),
  profile: {
    effective_permissions: [
      "places.list",
      "places.create",
      "places.update",
      "place_relationships.create",
      "charges.list",
    ],
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/commercial/inventory",
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      organization: { id: "org", name: "Harbour Group" },
      selectedSite: { id: "site", name: "Harbour Offices" },
      setSelectedSite: vi.fn(),
    }),
}));
vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { id: "user" } }),
}));
vi.mock("@/features/context/use-site-access", () => ({
  useSiteAccess: () => ({
    workspace: {
      data: mocks.profile,
      isPending: false,
      isError: false,
      isSuccess: true,
      isFetchedAfterMount: true,
      refetch: vi.fn(),
    },
    contextKey: "org:site:user",
    allowed: (requirement: string | string[]) => {
      const checks = Array.isArray(requirement) ? requirement : [requirement];
      return checks.some((permission) =>
        mocks.profile.effective_permissions.includes(permission),
      );
    },
  }),
}));
vi.mock("@/components/facets/FacetPicker", () => ({
  FacetPicker: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (item: {
      value: string;
      label: string;
      disabled: boolean;
      meta: { kind: string };
    }) => void;
  }) => (
    <button
      type="button"
      aria-label={label}
      onClick={() =>
        onChange({
          value: "party-business",
          label: "Acme Studio",
          disabled: false,
          meta: { kind: "organization" },
        })
      }
    >
      {label}
    </button>
  ),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock("@/features/invitation-approvals/api", () => ({
  invitationApprovalsApi: { list: mocks.invitations },
}));
vi.mock("@/features/maintenance/api", () => ({
  maintenanceApi: { list: async () => ({ items: [], total: 0 }) },
}));
vi.mock("@/features/contractors/api", () => ({
  contractorsApi: { list: async () => ({ items: [], total: 0 }) },
}));
vi.mock("@/features/places/api", () => ({
  placesApi: {
    create: mocks.createProperty,
    update: mocks.updateProperty,
    move: mocks.moveProperty,
    toggle: mocks.toggleProperty,
  },
}));
vi.mock("./api", () => ({
  commercialApi: {
    tree: mocks.tree,
    relationships: mocks.relationships,
    chargeAssignments: mocks.assignment,
    createRelationship: mocks.createRelationship,
  },
  flattenPlaces: (roots: TreeNode[]) => {
    const output: TreeNode[] = [];
    const visit = (node: TreeNode) => {
      output.push(node);
      node.children.forEach(visit);
    };
    roots.forEach(visit);
    return output;
  },
  descendantIds: (roots: TreeNode[], rootId: string) => {
    const flatten = (nodes: TreeNode[]): TreeNode[] =>
      nodes.flatMap((node) => [node, ...flatten(node.children)]);
    const root = flatten(roots).find((node) => node.id === rootId);
    return new Set(root ? flatten([root]).map((node) => node.id) : []);
  },
  isCommercialPlace: (place: TreeNode) =>
    place.kind === "building" ||
    (["unit", "space"].includes(place.kind) &&
      [
        "office",
        "shop",
        "retail_unit",
        "warehouse",
        "conference_room",
      ].includes(place.building_type || "")),
  isCommercialInventory: (place: TreeNode) =>
    ["unit", "space"].includes(place.kind) &&
    ["office", "shop", "retail_unit", "warehouse", "conference_room"].includes(
      place.building_type || "",
    ),
}));

type TreeNode = {
  id: string;
  name: string;
  kind: string;
  parent_id: string | null;
  building_type: string | null;
  description: string | null;
  address: string;
  is_active: boolean;
  updated_at: string;
  children: TreeNode[];
};

const space = (overrides: Partial<TreeNode> = {}): TreeNode => ({
  id: "suite-4a",
  name: "Suite 4A",
  kind: "unit",
  parent_id: "building",
  building_type: "office",
  description: null,
  address: "1 Harbour Way",
  is_active: true,
  updated_at: "2026-11-09T00:00:00Z",
  children: [],
  ...overrides,
});

const tree: TreeNode[] = [
  space({
    id: "site",
    name: "Harbour Offices",
    kind: "site",
    parent_id: null,
    building_type: null,
    children: [
      space({
        id: "building",
        name: "Harbour Tower",
        kind: "building",
        parent_id: "site",
        building_type: "office",
        children: [space()],
      }),
    ],
  }),
];

const tenant = {
  id: "tenant-relationship",
  organization_id: "org",
  role: "tenant",
  status: "active",
  effective_from: "2026-01-01T00:00:00Z",
  effective_to: "2026-11-20T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  party: {
    id: "party-business",
    kind: "organization",
    display_name: "Acme Studio",
    email: "lease@acme.test",
    is_active: true,
  },
  place: {
    id: "suite-4a",
    name: "Suite 4A",
    slug: "suite-4a",
    kind: "unit",
    is_active: true,
  },
};

function mount(node: ReactNode) {
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
      {node}
    </QueryClientProvider>,
  );
}

describe("commercial operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profile = {
      effective_permissions: [
        "places.list",
        "places.create",
        "places.update",
        "place_relationships.create",
        "charges.list",
      ],
    };
    mocks.tree.mockResolvedValue(tree);
    mocks.relationships.mockResolvedValue({ items: [tenant], total: 1 });
    mocks.assignment.mockResolvedValue([]);
    mocks.invitations.mockResolvedValue({ items: [], total: 0 });
    mocks.createProperty.mockResolvedValue(space());
    mocks.createRelationship.mockResolvedValue(tenant);
  });

  it("derives commercial inventory, tenancy and lease attention", async () => {
    mount(<CommercialOverview />);

    expect(
      await screen.findByRole("heading", { name: "Commercial overview" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("100% occupied")).toBeInTheDocument();
    expect((await screen.findAllByText("Acme Studio")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Lease attention").length).toBeGreaterThan(0);
    expect(screen.getByText("Occupancy by building")).toBeInTheDocument();
    expect(screen.getByText("Contractor access")).toBeInTheDocument();
  });

  it("lists buildings next to the spaces they contain", async () => {
    mount(<CommercialInventory />);

    expect(
      (await screen.findAllByRole("link", { name: "Harbour Tower" })).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Container").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Building").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Suite 4A").length).toBeGreaterThan(0);
  });

  it("creates a canonical office space", async () => {
    mount(<CommercialInventory />);

    const add = await screen.findByRole("button", {
      name: "Add commercial space",
    });
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.click(add);
    const dialog = await screen.findByRole("dialog", {
      name: "Add commercial space",
    });
    fireEvent.change(within(dialog).getByLabelText(/^Space name/), {
      target: { value: "Suite 5B" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Address/), {
      target: { value: "2 Harbour Way" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add space" }));

    await waitFor(() =>
      expect(mocks.createProperty).toHaveBeenCalledWith({
        site_id: "site",
        name: "Suite 5B",
        kind: "unit",
        building_type: "office",
        address: "2 Harbour Way",
        description: "",
        parent_id: "building",
      }),
    );
  });

  it("creates a building from the same space type list", async () => {
    mount(<CommercialInventory />);

    const add = await screen.findByRole("button", {
      name: "Add commercial space",
    });
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.click(add);
    const dialog = await screen.findByRole("dialog", {
      name: "Add commercial space",
    });
    fireEvent.change(within(dialog).getByLabelText(/^Space name/), {
      target: { value: "Tower B" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Space type/), {
      target: { value: "building" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add space" }));

    await waitFor(() =>
      expect(mocks.createProperty).toHaveBeenCalledWith(
        expect.objectContaining({
          site_id: "site",
          name: "Tower B",
          kind: "building",
          building_type: "building",
          parent_id: null,
        }),
      ),
    );
  });

  it("creates a space at the top level without a building", async () => {
    mount(<CommercialInventory />);

    const add = await screen.findByRole("button", {
      name: "Add commercial space",
    });
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.click(add);
    const dialog = await screen.findByRole("dialog", {
      name: "Add commercial space",
    });
    fireEvent.change(within(dialog).getByLabelText(/^Space name/), {
      target: { value: "Kiosk 1" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Building/), {
      target: { value: "" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add space" }));

    await waitFor(() =>
      expect(mocks.createProperty).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Kiosk 1",
          kind: "unit",
          building_type: "office",
          parent_id: null,
        }),
      ),
    );
  });

  it("moves a space out of its building from the edit form", async () => {
    mocks.updateProperty.mockResolvedValue(space());
    mount(<CommercialInventory />);

    const edit = await screen.findByRole("button", {
      name: "Edit Suite 4A",
    });
    fireEvent.click(edit);
    const dialog = await screen.findByRole("dialog", {
      name: "Edit commercial space",
    });
    fireEvent.change(within(dialog).getByLabelText(/^Building/), {
      target: { value: "" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save space" }));

    await waitFor(() =>
      expect(mocks.moveProperty).toHaveBeenCalledWith("suite-4a", null),
    );
  });

  it("offers buildings as party targets alongside the spaces", async () => {
    mount(<CommercialTenants />);

    const assign = await screen.findByRole("button", { name: "Add party" });
    await waitFor(() => expect(assign).toBeEnabled());
    fireEvent.click(assign);
    const dialog = await screen.findByRole("dialog", {
      name: "Add party to a space",
    });
    const options = Array.from(
      within(dialog)
        .getByLabelText(/^Commercial space/)
        .querySelectorAll("option"),
    ).map((option) => option.textContent);
    // A whole-building lease is real, so the building is selectable — but the
    // picker defaults to the lettable space, not the container.
    expect(options).toEqual(["Suite 4A", "Harbour Tower · Building"]);
  });

  it("assigns an organization as a business tenant with a lease period", async () => {
    mount(<CommercialTenants />);

    const assign = await screen.findByRole("button", {
      name: "Add party",
    });
    await waitFor(() => expect(assign).toBeEnabled());
    fireEvent.click(assign);
    const dialog = await screen.findByRole("dialog", {
      name: "Add party to a space",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Business organization" }),
    );
    fireEvent.change(within(dialog).getByLabelText(/^Lease end/), {
      target: { value: "2027-12-31" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add party" }),
    );

    await waitFor(() =>
      expect(mocks.createRelationship).toHaveBeenCalledWith(
        expect.objectContaining({
          party_id: "party-business",
          place_id: "suite-4a",
          role: "tenant",
          status: "active",
        }),
      ),
    );
  });
});
