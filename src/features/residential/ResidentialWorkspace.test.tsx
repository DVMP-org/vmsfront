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
      selectedProperty: { id: "site", name: "Harbour Heights" },
      setSelectedProperty: vi.fn(),
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

vi.mock("@/features/properties/api", () => ({
  propertiesApi: {
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
    const overview = within(panel).getByRole("tab", { name: "Overview" });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(
      within(panel).getByRole("tabpanel", { name: "Overview" }),
    ).toBeVisible();
    expect(within(panel).getByText("12 Harbour Road")).toBeVisible();
    expect(within(panel).getByText("Recorded activity")).toBeVisible();
    const residentsTab = within(panel).getByRole("tab", { name: "Residents" });
    fireEvent.click(residentsTab);
    expect(
      within(panel).getByRole("tabpanel", { name: "Residents" }),
    ).toBeVisible();
    expect(
      within(panel).getByRole("link", { name: "Ada Resident" }),
    ).toHaveAttribute("href", "/admin/residential/occupancies/relationship");
    expect(within(panel).getByText("ada@example.test")).toBeVisible();
    expect(
      within(panel).queryByRole("tabpanel", { name: "Overview" }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(residentsTab, { key: "ArrowRight" });
    expect(within(panel).getByRole("tab", { name: "Charges" })).toHaveFocus();
    expect(
      within(panel).getByRole("tabpanel", { name: "Charges" }),
    ).toBeVisible();
    fireEvent.keyDown(within(panel).getByRole("tab", { name: "Charges" }), {
      key: "Home",
    });
    expect(overview).toHaveFocus();
    expect(overview).toHaveAttribute("aria-selected", "true");
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
    expect(dialog).toHaveAttribute("data-state", "closed");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Apartment 4B" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("keeps charge currencies separate and only shows the selected unit's assignments", async () => {
    const assignment = {
      id: "charge-ngn",
      target_place: { id: "unit-4b", name: "Apartment 4B" },
      charge_definition: {
        name: "Service charge",
        amount: "1500",
        currency: "NGN",
        recurrence: "monthly",
      },
      outstanding_amount: "500",
      next_due_date: "2026-12-01",
      current_responsibility: null,
    };
    mocks.chargeAssignments.mockResolvedValue([
      assignment,
      {
        ...assignment,
        id: "charge-usd",
        charge_definition: {
          ...assignment.charge_definition,
          name: "Insurance",
          currency: "USD",
        },
        outstanding_amount: "20",
      },
      {
        ...assignment,
        id: "other-unit",
        target_place: { id: "unit-other", name: "Other unit" },
        charge_definition: {
          ...assignment.charge_definition,
          name: "Other unit charge",
        },
      },
    ]);
    mount(<ResidentialUnits />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open Apartment 4B" }),
    );
    const panel = screen.getByRole("dialog", { name: "Apartment 4B" });
    fireEvent.click(within(panel).getByRole("tab", { name: "Charges" }));
    expect(
      await within(panel).findByText("Service charge"),
    ).toBeInTheDocument();
    expect(within(panel).getByText("Insurance")).toBeInTheDocument();
    expect(
      within(panel).queryByText("Other unit charge"),
    ).not.toBeInTheDocument();
    expect(within(panel).getAllByText(/500.00/).length).toBeGreaterThan(0);
    expect(within(panel).getAllByText(/\$20.00/).length).toBeGreaterThan(0);
    expect(within(panel).queryByText(/520.00/)).not.toBeInTheDocument();
  });

  it("retries failed detail charges and keeps restricted charges out of read-only views", async () => {
    mocks.chargeAssignments
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValue([]);
    const { unmount } = mount(<ResidentialUnits />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open Apartment 4B" }),
    );
    const panel = screen.getByRole("dialog", { name: "Apartment 4B" });
    fireEvent.click(within(panel).getByRole("tab", { name: "Charges" }));
    fireEvent.click(
      await within(panel).findByRole("button", { name: "Retry charges" }),
    );
    expect(
      await within(panel).findByText("No charges assigned to this unit."),
    ).toBeInTheDocument();
    unmount();
    mocks.chargeAssignments.mockClear();
    mocks.profile.effective_permissions = ["places.list"];
    mount(<ResidentialUnits />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open Apartment 4B" }),
    );
    const readOnly = screen.getByRole("dialog", { name: "Apartment 4B" });
    fireEvent.click(within(readOnly).getByRole("tab", { name: "Charges" }));
    expect(
      within(readOnly).getByText(
        "Charge information is not available with your access.",
      ),
    ).toBeInTheDocument();
    expect(mocks.chargeAssignments).not.toHaveBeenCalled();
    expect(
      within(readOnly).queryByRole("button", { name: "Edit unit" }),
    ).not.toBeInTheDocument();
    expect(
      within(readOnly).queryByRole("button", { name: "Assign resident" }),
    ).not.toBeInTheDocument();
  });

  it("edits the selected unit from its detail drawer", async () => {
    mocks.update.mockResolvedValue(unit({ name: "Apartment 4C" }));
    mount(<ResidentialUnits />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open Apartment 4B" }),
    );
    const panel = screen.getByRole("dialog", { name: "Apartment 4B" });
    fireEvent.click(within(panel).getByRole("button", { name: "Edit unit" }));
    const edit = screen.getByRole("dialog", { name: "Edit Apartment 4B" });
    expect(within(edit).getByLabelText(/^Address/)).toHaveValue(
      "12 Harbour Road",
    );
    fireEvent.change(within(edit).getByLabelText(/^Unit name/), {
      target: { value: "Apartment 4C" },
    });
    fireEvent.click(within(edit).getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith("unit-4b", {
        name: "Apartment 4C",
        address: "12 Harbour Road",
        description: "",
      }),
    );
  });

  it("links unit validation to its control and resets an abandoned create session", async () => {
    mount(<ResidentialUnits />);
    const add = await screen.findByRole("button", { name: "Add unit" });
    fireEvent.click(add);
    const dialog = screen.getByRole("dialog", {
      name: "Add a residential unit",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create unit" }),
    );
    fireEvent.click(
      within(dialog).getByRole("link", {
        name: "Enter a unit name or number.",
      }),
    );
    expect(within(dialog).getByLabelText(/^Unit name/)).toHaveFocus();
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText(/^Unit name/), {
      target: { value: "Draft unit" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(add);
    const reopened = screen.getByRole("dialog", {
      name: "Add a residential unit",
    });
    expect(within(reopened).getByLabelText(/^Unit name/)).toHaveValue("");
    expect(within(reopened).queryByRole("alert")).not.toBeInTheDocument();
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
    const trigger = await screen.findByRole("button", {
      name: "View Ada Resident details",
    });
    trigger.focus();
    fireEvent.click(trigger);
    const panel = screen.getByRole("dialog", { name: "Resident details" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(within(panel).getByText("ada@example.test")).toBeInTheDocument();
    expect(
      within(panel).getByRole("link", { name: "View full profile" }),
    ).toHaveAttribute("href", "/admin/residential/occupancies/relationship");
    fireEvent.click(
      within(panel).getByRole("button", { name: "Close drawer" }),
    );
    expect(panel).toHaveAttribute("data-state", "closed");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Resident details" }),
      ).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
    fireEvent.click(
      screen.getByRole("button", { name: "Open Ada Resident details" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Resident details" }),
    ).toBeInTheDocument();
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
