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

import ResidentialMaintenance from "./ResidentialMaintenance";
import ResidentialOverview from "./ResidentialOverview";
import ResidentialUnits from "./ResidentialUnits";

const mocks = vi.hoisted(() => ({
  tree: vi.fn(),
  relationships: vi.fn(),
  maintenance: vi.fn(),
  createMaintenance: vi.fn(),
  updateMaintenance: vi.fn(),
  chargeAssignments: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  toggle: vi.fn(),
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

vi.mock("@/hooks/use-admin", () => ({
  useAdminProfile: () => ({
    data: mocks.profile,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./api", () => ({
  residentialApi: {
    tree: mocks.tree,
    relationships: mocks.relationships,
    maintenance: mocks.maintenance,
    createMaintenance: mocks.createMaintenance,
    updateMaintenance: mocks.updateMaintenance,
    chargeAssignments: mocks.chargeAssignments,
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
  place_id: "unit-4b",
  place: { id: "unit-4b", name: "Apartment 4B" },
  reported_by_party_id: "resident",
  reported_by: { id: "resident", display_name: "Ada Resident" },
  assigned_to_party_id: null,
  assigned_to: null,
  title: "Kitchen tap is leaking",
  description: "The cold-water tap under the sink is continuously dripping.",
  category: "plumbing",
  priority: "high" as const,
  status: "open" as const,
  due_at: "2026-11-10T09:00:00Z",
  created_at: "2026-11-09T08:00:00Z",
  updated_at: "2026-11-09T08:00:00Z",
  resolved_at: null,
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
    mocks.create.mockResolvedValue(unit());
    mocks.createMaintenance.mockResolvedValue(maintenanceRequest);
    mocks.updateMaintenance.mockResolvedValue({
      ...maintenanceRequest,
      status: "in_progress",
    });
  });

  it("derives the residential summary from units, relationships and requests", async () => {
    mount(<ResidentialOverview />);

    expect(await screen.findByText("Harbour Heights")).toBeInTheDocument();
    expect(
      (await screen.findAllByText("Kitchen tap is leaking")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("1 with an active household")).toBeInTheDocument();
    expect(
      screen.getByText("Open, triaged or in progress"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open unit register/ }),
    ).toHaveAttribute("href", "/admin/residential/units");
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

  it("validates and raises a unit-linked maintenance request", async () => {
    mount(<ResidentialMaintenance />);

    expect(
      (await screen.findAllByText("Kitchen tap is leaking")).length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Raise request" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Raise a maintenance request",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Raise request" }),
    );
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Enter a concise issue title",
    );
    expect(mocks.createMaintenance).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/^Issue/), {
      target: { value: "Lobby light failure" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Description/), {
      target: { value: "The shared lobby light no longer turns on." },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Raise request" }),
    );
    await waitFor(() =>
      expect(mocks.createMaintenance).toHaveBeenCalledWith(
        expect.objectContaining({
          place_id: "unit-4b",
          title: "Lobby light failure",
          category: "plumbing",
          priority: "normal",
        }),
      ),
    );
  });

  it("shows a retryable maintenance error without inventing a zero balance", async () => {
    mocks.maintenance.mockRejectedValue(new Error("Maintenance offline"));
    mount(<ResidentialOverview />);

    expect(
      await screen.findByText("Maintenance unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("Maintenance offline")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Retry maintenance/ }),
    ).toBeInTheDocument();
  });
});
