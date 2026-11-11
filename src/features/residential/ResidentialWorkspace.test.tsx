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

import ResidentialOverview from "./ResidentialOverview";
import { ResidentProfile } from "./ResidentProfile";
import ResidentialOccupancies from "./ResidentialOccupancies";
import ResidentialUnits from "./ResidentialUnits";

const mocks = vi.hoisted(() => ({
  tree: vi.fn(),
  relationships: vi.fn(),
  relationship: vi.fn(),
  maintenance: vi.fn(),
  chargeAssignments: vi.fn(),
  announcements: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  toggle: vi.fn(),
  createRelationship: vi.fn(),
  addPerson: vi.fn(),
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
  usePathname: () => "/admin/residential/units",
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      organization: { id: "org", name: "Harbour Estates" },
      selectedSite: { id: "site", name: "Harbour Heights" },
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
    value,
    onChange,
  }: {
    label: string;
    value: unknown;
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
          value: "resident",
          label: "Ada Resident",
          disabled: false,
          meta: { kind: "person" },
        })
      }
    >
      {value ? "Selected person" : label}
    </button>
  ),
}));

vi.mock("@/features/places/api", () => ({
  placeRelationshipsApi: { create: mocks.createRelationship },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/features/maintenance/api", () => ({
  maintenanceApi: { list: mocks.maintenance },
}));

vi.mock("./api", () => ({
  residentialApi: {
    tree: mocks.tree,
    relationships: mocks.relationships,
    relationship: mocks.relationship,
    maintenance: mocks.maintenance,
    chargeAssignments: mocks.chargeAssignments,
    announcements: mocks.announcements,
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
}));

vi.mock("@/features/places/api", () => ({
  placesApi: {
    create: mocks.create,
    update: mocks.update,
    toggle: mocks.toggle,
  },
}));

vi.mock("@/features/people/api", () => ({
  peopleApi: { add: mocks.addPerson },
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

const unit = (overrides: Partial<TreeNode> = {}): TreeNode => ({
  id: "unit-4b",
  name: "Apartment 4B",
  kind: "unit",
  parent_id: "building-a",
  building_type: "apartment",
  description: null,
  address: "12 Harbour Road",
  is_active: true,
  updated_at: "2026-11-09T00:00:00Z",
  children: [],
  ...overrides,
});

const tree: TreeNode[] = [
  {
    ...unit({
      id: "site",
      name: "Harbour Heights",
      kind: "site",
      parent_id: null,
      building_type: null,
      children: [
        {
          ...unit({
            id: "building-a",
            name: "Block A",
            kind: "building",
            parent_id: "site",
            building_type: "apartment_block",
            children: [unit()],
          }),
        },
      ],
    }),
  },
];

const relationship = {
  id: "relationship",
  organization_id: "org",
  role: "resident",
  status: "active",
  effective_from: "2026-01-01T00:00:00Z",
  effective_to: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  party: {
    id: "resident",
    kind: "person",
    display_name: "Ada Resident",
    email: "ada@example.test",
    is_active: true,
  },
  place: {
    id: "unit-4b",
    name: "Apartment 4B",
    slug: "apartment-4b",
    kind: "unit",
    is_active: true,
  },
};

const maintenanceRequest = {
  id: "request",
  property_place_id: "site",
  place: { id: "unit-4b", name: "Apartment 4B" },
  domain: "residential" as const,
  request_type: "request" as const,
  reported_by: { id: "resident", display_name: "Ada Resident" },
  assigned_to: null,
  contractor: null,
  approval_status: "not_required" as const,
  title: "Kitchen tap is leaking",
  description: "The cold-water tap under the sink is continuously dripping.",
  category: "plumbing",
  priority: "high" as const,
  status: "open" as const,
  due_at: "2026-11-10T09:00:00Z",
  scheduled_for: null,
  closed_at: null,
  resolution_notes: null,
  cost_estimate: null,
  actual_cost: null,
  currency: "NGN",
  requires_access_authorization: true,
  affects_room_availability: false,
  expense_allocation_required: false,
  created_at: "2026-11-09T08:00:00Z",
  updated_at: "2026-11-09T08:00:00Z",
  resolved_at: null,
  activities: [],
};

function mount(node: ReactNode) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {node}
    </QueryClientProvider>,
  );
}

describe("residential operations", () => {
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
    mocks.relationships.mockResolvedValue({ items: [relationship], total: 1 });
    mocks.maintenance.mockResolvedValue({
      items: [maintenanceRequest],
      total: 1,
    });
    mocks.chargeAssignments.mockResolvedValue([]);
    mocks.announcements.mockResolvedValue({ items: [], total: 0 });
    mocks.create.mockResolvedValue(unit());
    mocks.createRelationship.mockResolvedValue(relationship);
    mocks.addPerson.mockResolvedValue({
      assignment_id: "new-relationship",
      role: "resident",
      status: "active",
    });
  });

  it("derives the residential summary from units, relationships and requests", async () => {
    mount(<ResidentialOverview />);

    expect(await screen.findByText("Harbour Heights")).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/Kitchen tap is leaking/)).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Occupied").length).toBeGreaterThan(0);
    expect(screen.getByText("Occupancy breakdown")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Add unit/ })).toHaveAttribute(
      "href",
      "/admin/residential/units?create=1",
    );
  });

  it("opens and closes the selected unit details", async () => {
    mount(<ResidentialUnits />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open Apartment 4B" }),
    );
    const panel = screen.getByRole("dialog", { name: "Apartment 4B" });
    expect(within(panel).getByText("Occupant")).toBeInTheDocument();
    expect(
      within(panel).getByRole("link", { name: "View unit" }),
    ).toHaveAttribute("href", "/admin/places/unit-4b");
    fireEvent.click(
      within(panel).getByRole("button", { name: "Assign resident" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Assign a household relationship",
    });
    expect(within(dialog).getByLabelText(/^Unit/)).toHaveValue("unit-4b");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("dialog", { name: "Apartment 4B" }),
    ).not.toBeInTheDocument();
  });

  it("creates a canonical unit from the unit register", async () => {
    mount(<ResidentialUnits />);

    const addUnit = await screen.findByRole("button", { name: "Add unit" });
    await waitFor(() => expect(addUnit).toBeEnabled());
    fireEvent.click(addUnit);
    const dialog = await screen.findByRole("dialog", {
      name: "Add a residential unit",
    });
    fireEvent.change(within(dialog).getByLabelText(/^Unit name/), {
      target: { value: "Apartment 5C" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Building or site/), {
      target: { value: "building-a" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Address/), {
      target: { value: "14 Harbour Road" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create unit" }),
    );

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        site_id: "site",
        name: "Apartment 5C",
        kind: "unit",
        address: "14 Harbour Road",
        description: "",
        parent_id: "building-a",
        building_type: "apartment",
      }),
    );
  });

  it("creates a unit directly under the selected Site when no building exists", async () => {
    mocks.tree.mockResolvedValue([
      unit({ id: "unit-a", name: "Unit A", parent_id: null }),
    ]);
    mount(<ResidentialUnits />);

    fireEvent.click(await screen.findByRole("button", { name: "Add unit" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Add a residential unit",
    });
    fireEvent.change(within(dialog).getByLabelText(/^Unit name/), {
      target: { value: "Garden Unit" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create unit" }),
    );

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        site_id: "site",
        name: "Garden Unit",
        kind: "unit",
        address: "",
        description: "",
        building_type: "apartment",
      }),
    );
  });

  it("loads the selected resident profile and household", async () => {
    mocks.relationship.mockResolvedValue(relationship);
    mount(<ResidentProfile relationshipId="relationship" />);
    expect(
      await screen.findByRole("heading", { name: "Ada Resident" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ada@example.test")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /Ada Resident/ }),
    ).toHaveAttribute("href", "/admin/residential/occupancies/relationship");
    expect(mocks.relationship).toHaveBeenCalledWith("relationship");
  });

  it("opens resident details from the row action and links to the profile", async () => {
    mount(<ResidentialOccupancies />);
    expect(screen.queryByLabelText("Resident details")).not.toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole("button", { name: "View Ada Resident details" }),
    );
    const panel = screen.getByLabelText("Resident details");
    expect(within(panel).getByText("ada@example.test")).toBeInTheDocument();
    expect(
      within(panel).getByRole("link", { name: "View full profile" }),
    ).toHaveAttribute("href", "/admin/residential/occupancies/relationship");
    fireEvent.click(
      within(panel).getByRole("button", { name: "Close resident details" }),
    );
    expect(screen.queryByLabelText("Resident details")).not.toBeInTheDocument();
  });

  it("onboards a new resident directly from Assign household", async () => {
    mount(<ResidentialOccupancies />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Add resident" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Assign a household relationship",
    });
    fireEvent.click(
      within(dialog).getByRole("radio", { name: "New resident" }),
    );
    fireEvent.change(within(dialog).getByLabelText(/^Full name/), {
      target: { value: "Tunde Resident" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Email address/), {
      target: { value: "Tunde@Example.test" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Phone number/), {
      target: { value: "08012345678" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Assign relationship" }),
    );

    await waitFor(() =>
      expect(mocks.addPerson).toHaveBeenCalledWith(
        "site",
        expect.objectContaining({
          place_id: "unit-4b",
          display_name: "Tunde Resident",
          email: "tunde@example.test",
          phone: "08012345678",
          kind: "person",
          role: "resident",
        }),
      ),
    );
  });

  it("surfaces occupied units and read-only access without mutation controls", async () => {
    mocks.profile = { effective_permissions: ["places.list"] };
    mount(<ResidentialUnits />);

    expect((await screen.findAllByText("Apartment 4B")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Occupied").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ada Resident").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Add unit" }),
    ).not.toBeInTheDocument();
  });

  it("shows a retryable maintenance error without inventing a zero balance", async () => {
    mocks.maintenance.mockRejectedValue(new Error("Maintenance offline"));
    mount(<ResidentialOverview />);

    expect(
      (await screen.findAllByText("Maintenance offline")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Retry maintenance/ }),
    ).toBeInTheDocument();
  });
});
