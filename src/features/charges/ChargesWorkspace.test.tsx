import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChargesWorkspace from "./ChargesWorkspace";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  profileData: {
    effective_permissions: [] as string[],
  },
  definitions: vi.fn(),
  definition: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  assignments: vi.fn(),
  assignment: vi.fn(),
  assign: vi.fn(),
  assignGroup: vi.fn(),
  assignTargets: vi.fn(),
  groups: vi.fn(),
  schedules: vi.fn(),
  generate: vi.fn(),
  transfer: vi.fn(),
  loadFacets: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: {
      organization: { id: string };
      selectedSite: { id: string; name: string };
    }) => unknown,
  ) =>
    selector({
      organization: { id: "org" },
      selectedSite: { id: "site", name: "Harbour Campus" },
    }),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "user" } }),
}));

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
    contextKey: "org:site:user",
    allowed: (requirement: string | string[]) => {
      const checks = Array.isArray(requirement) ? requirement : [requirement];
      return checks.some((permission) => {
        const resource = permission.split(".")[0];
        return (
          mocks.profileData.effective_permissions.includes(permission) ||
          mocks.profileData.effective_permissions.includes(`${resource}.*`)
        );
      });
    },
  }),
}));

vi.mock("@/components/facets/FacetPicker", () => ({
  FacetPicker: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (item: { value: string; label: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange({ value: "selected-party", label: "Selected" })}
    >
      Choose {label}
    </button>
  ),
}));

vi.mock("./api", () => ({ chargesApi: mocks }));
vi.mock("@/components/facets/client", () => ({
  loadFacets: mocks.loadFacets,
}));
vi.mock("@/features/place-groups/api", () => ({
  placeGroupsApi: { list: mocks.groups },
}));

const definition = {
  id: "charge",
  site_id: "site",
  name: "Service charge",
  description: "Monthly property service",
  amount: "15000.00",
  currency: "NGN",
  recurrence: "monthly",
  is_active: true,
};

const assignment = {
  id: "assignment",
  charge_definition: definition,
  target_place: { id: "place", name: "Harbour House" },
  current_responsibility: {
    id: "responsibility",
    responsible_party: { display_name: "Ade Resident" },
  },
  outstanding_amount: "15000.00",
};

function mount(
  action?: "new" | "definition" | "assignment",
  id = "charge",
) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ChargesWorkspace action={action} id={id} />
    </QueryClientProvider>,
  );
}

describe("charge routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profileData = { effective_permissions: ["charges.*"] };
    mocks.definitions.mockResolvedValue({
      items: [definition],
      total_pages: 1,
    });
    mocks.definition.mockResolvedValue(definition);
    mocks.assignments.mockResolvedValue({
      items: [assignment],
      total_pages: 1,
    });
    mocks.assignment.mockResolvedValue(assignment);
    mocks.schedules.mockResolvedValue({ items: [], total_pages: 0 });
    mocks.loadFacets.mockResolvedValue({
      contract_version: "vmscore.facets/v1",
      facet: "places",
      items: [
        {
          value: "place",
          label: "Harbour House",
          disabled: false,
          description: "Block A",
          meta: { kind: "unit", slug: "harbour-house", parent_id: null },
        },
      ],
      has_more: false,
      next_cursor: null,
      revision: "1",
    });
    mocks.groups.mockResolvedValue([
      {
        id: "group",
        name: "West wing",
        description: null,
        site_id: "site",
        organization_id: "org",
        created_by_site_admin_id: null,
        places: [
          { id: "place-1", name: "Unit 1" },
          { id: "place-2", name: "Unit 2" },
        ],
        created_at: "2026-11-09T00:00:00Z",
        updated_at: "2026-11-09T00:00:00Z",
      },
    ]);
  });

  it("renders charge definitions as stable detail links", async () => {
    mount();
    const definitionLinks = await screen.findAllByRole("link", {
      name: /Service charge/,
    });
    expect(definitionLinks[0]).toHaveAttribute(
      "href",
      "/admin/charges/definitions/charge",
    );
    expect(
      screen.getByRole("button", { name: "Create charge" }),
    ).toBeInTheDocument();
  });

  it("shows an explicit empty state without inventing balances", async () => {
    mocks.definitions.mockResolvedValue({ items: [], total_pages: 0 });
    mount();
    expect(
      (await screen.findAllByText("No charges yet.")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/NGN 15000/)).toBeNull();
  });

  it("fails closed without charge-list permission", async () => {
    mocks.profileData = { effective_permissions: ["places.list"] };
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "do not have permission",
    );
    expect(mocks.definitions).not.toHaveBeenCalled();
  });

  it("hides mutating controls for read-only finance access", async () => {
    mocks.profileData = { effective_permissions: ["charges.list"] };
    mount();
    expect(
      (await screen.findAllByText("Service charge")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Create charge" }),
    ).not.toBeInTheDocument();
  });

  it("shows a retryable failure when the charge directory is unavailable", async () => {
    mocks.definitions.mockRejectedValue(new Error("Charge service offline"));
    mount();
    expect(
      await screen.findByText("Charges could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.getByText("Charge service offline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument();
  });

  it("validates a new charge with a linked error summary", async () => {
    mount("new");
    const drawer = await screen.findByRole("dialog", {
      name: "Create a charge",
    });
    await waitFor(() =>
      expect(within(drawer).getByLabelText(/^Name/)).toHaveFocus(),
    );
    fireEvent.click(
      within(drawer).getByRole("button", { name: "Create charge" }),
    );
    expect(
      (await screen.findAllByText("Enter a charge name.")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Enter an amount greater than zero.").length,
    ).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates a definition and opens its detail route", async () => {
    mocks.create.mockResolvedValue(definition);
    mount("new");
    fireEvent.change(await screen.findByLabelText(/^Name/), {
      target: { value: "Service charge" },
    });
    fireEvent.change(screen.getByLabelText(/^Amount/), {
      target: { value: "15000" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Create a charge" })).getByRole(
        "button",
        { name: "Create charge" },
      ),
    );
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/admin/charges/definitions/charge",
      ),
    );
    await waitFor(() => expect(mocks.definitions).toHaveBeenCalledTimes(2));
  });

  it("hides the schedule window until it is enabled", async () => {
    mocks.create.mockResolvedValue(definition);
    mount("new");
    const drawer = await screen.findByRole("dialog", {
      name: "Create a charge",
    });
    expect(within(drawer).queryByLabelText(/^Start date/)).toBeNull();
    expect(within(drawer).queryByLabelText(/^End date/)).toBeNull();

    fireEvent.change(within(drawer).getByLabelText(/^Name/), {
      target: { value: "Service charge" },
    });
    fireEvent.change(within(drawer).getByLabelText(/^Amount/), {
      target: { value: "15000" },
    });
    fireEvent.click(
      within(drawer).getByRole("checkbox", { name: /Set a schedule window/ }),
    );
    fireEvent.change(await within(drawer).findByLabelText(/^End date/), {
      target: { value: "2027-03-31" },
    });
    fireEvent.click(
      within(drawer).getByRole("button", { name: "Create charge" }),
    );

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: expect.any(String),
          end_date: expect.any(String),
        }),
      ),
    );
  });

  it("opens assignment actions without duplicate definitions", async () => {
    mount("definition");
    const assignmentLinks = await screen.findAllByRole("link", {
      name: /Harbour House/,
    });
    expect(assignmentLinks[0]).toHaveAttribute(
      "href",
      "/admin/charges/assignments/assignment",
    );
    expect(
      screen.getByRole("button", { name: "Assign charge" }),
    ).toBeInTheDocument();
  });

  it("assigns to a Place from the drawer without asking for a schedule count", async () => {
    mocks.assignTargets.mockResolvedValue({
      created: [assignment],
      skipped: [],
      target_count: 1,
    });
    mount("definition");
    fireEvent.click(await screen.findByRole("button", { name: "Assign charge" }));
    const drawer = await screen.findByRole("dialog", {
      name: /Assign Service charge/,
    });
    const submit = within(drawer).getByRole("button", { name: "Assign charge" });
    expect(submit).toBeDisabled();
    expect(within(drawer).queryByLabelText(/Initial schedules/i)).toBeNull();
    expect(within(drawer).queryByLabelText(/First due date/i)).toBeNull();

    fireEvent.click(
      await within(drawer).findByRole("option", { name: /Harbour House/ }),
    );
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    // No payer chosen: the fee is payable by any Party at the Place.
    await waitFor(() =>
      expect(mocks.assignTargets).toHaveBeenCalledWith({
        charge_definition_id: "charge",
        target_place_ids: ["place"],
      }),
    );
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/admin/charges/assignments/assignment",
      ),
    );
  });

  it("assigns one charge definition across a Place group", async () => {
    mocks.assignTargets.mockResolvedValue({
      created: [assignment, { ...assignment, id: "two" }],
      skipped: [],
      target_count: 2,
    });
    mount("definition");
    fireEvent.click(await screen.findByRole("button", { name: "Assign charge" }));
    const drawer = await screen.findByRole("dialog", {
      name: /Assign Service charge/,
    });
    fireEvent.change(await within(drawer).findByLabelText(/^Place group/i), {
      target: { value: "group" },
    });
    fireEvent.click(
      within(drawer).getByRole("button", {
        name: /Choose Responsible person or organization/,
      }),
    );
    const submit = within(drawer).getByRole("button", { name: "Assign charge" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(mocks.assignTargets).toHaveBeenCalledWith({
        charge_definition_id: "charge",
        target_place_ids: [],
        place_group_id: "group",
        responsible_party_id: "selected-party",
      }),
    );
    expect(mocks.push).not.toHaveBeenCalledWith(
      "/admin/charges/assignments/two",
    );
  });

  it("shows the responsible payer and schedule balances on an assignment", async () => {
    mocks.schedules.mockResolvedValue({
      items: [
        {
          id: "schedule",
          due_date: "2026-12-10T00:00:00Z",
          amount: "15000.00",
          balance: "15000.00",
          currency: "NGN",
          status: "scheduled",
        },
      ],
      total: 1,
      total_pages: 1,
    });

    mount("assignment", "assignment");

    expect(
      await screen.findByRole("heading", {
        name: "Service charge",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Ade Resident").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/15,000\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("scheduled").length).toBeGreaterThan(0);
  });

  it("reviews and transfers an unpaid responsibility", async () => {
    mocks.transfer.mockResolvedValue({});
    mount("assignment", "assignment");

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Choose New responsible person or organization",
      }),
    );
    fireEvent.change(screen.getByLabelText(/^Reason/), {
      target: { value: "Occupancy changed" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Review and transfer" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Transfer responsibility" }),
    );

    await waitFor(() =>
      expect(mocks.transfer).toHaveBeenCalledWith("assignment", {
        responsible_party_id: "selected-party",
        expected_responsibility_id: "responsibility",
        reason: "Occupancy changed",
      }),
    );
  });

  it("generates additional schedules for an assignment", async () => {
    mocks.generate.mockResolvedValue([]);

    mount("assignment", "assignment");

    fireEvent.change(await screen.findByLabelText(/^Schedules/), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate schedules" }));

    await waitFor(() =>
      expect(mocks.generate).toHaveBeenCalledWith("assignment", {
        schedule_count: 3,
      }),
    );
  });

  it("waits for an acknowledged cadence before scheduling a flexible fee", async () => {
    mocks.assignment.mockResolvedValue({
      ...assignment,
      charge_definition: { ...definition, is_flexible: true },
    });
    mocks.schedules.mockResolvedValue({ items: [], total: 0, total_pages: 0 });
    mocks.generate.mockResolvedValue([]);

    mount("assignment", "assignment");

    expect(await screen.findByText("No schedule yet")).toBeInTheDocument();
    expect(
      screen.getByText(/nothing is scheduled when it is assigned/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Generate schedules" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Schedule cadence" }));
    fireEvent.click(
      await within(screen.getByRole("dialog")).findByRole("button", {
        name: "Create schedule",
      }),
    );

    await waitFor(() =>
      expect(mocks.generate).toHaveBeenCalledWith("assignment", {
        schedule_count: 1,
        cadence: "monthly",
      }),
    );
  });
});
