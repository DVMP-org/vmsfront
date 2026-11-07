import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChargesWorkspace from "./ChargesWorkspace";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  profile: vi.fn(),
  definitions: vi.fn(),
  definition: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  assignments: vi.fn(),
  assignment: vi.fn(),
  assign: vi.fn(),
  schedules: vi.fn(),
  generate: vi.fn(),
  transfer: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: { organization: { id: string } }) => unknown,
  ) => selector({ organization: { id: "org" } }),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "user" } }),
}));

vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
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

const definition = {
  id: "charge",
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
  action?: "new" | "definition" | "assign" | "assignment",
  id = "charge",
) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ChargesWorkspace action={action} id={id} />
    </QueryClientProvider>,
  );
}

describe("charge routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profile.mockResolvedValue({
      data: { effective_permissions: ["charges.*"] },
    });
    mocks.definitions.mockResolvedValue({
      items: [definition],
      total_pages: 1,
    });
    mocks.definition.mockResolvedValue(definition);
    mocks.assignments.mockResolvedValue({ items: [assignment], total_pages: 1 });
    mocks.assignment.mockResolvedValue(assignment);
    mocks.schedules.mockResolvedValue({ items: [], total_pages: 0 });
  });

  it("renders charge definitions as stable detail links", async () => {
    mount();
    expect(
      await screen.findByRole("link", { name: /Service charge/ }),
    ).toHaveAttribute("href", "/admin/charges/definitions/charge");
    expect(
      screen.getByRole("link", { name: "Create charge" }),
    ).toHaveAttribute("href", "/admin/charges/new");
  });

  it("shows an explicit empty state without inventing balances", async () => {
    mocks.definitions.mockResolvedValue({ items: [], total_pages: 0 });
    mount();
    expect(await screen.findByText("No charges yet.")).toBeInTheDocument();
    expect(screen.queryByText(/NGN 15000/)).toBeNull();
  });

  it("fails closed without charge-list permission", async () => {
    mocks.profile.mockResolvedValue({
      data: { effective_permissions: ["places.list"] },
    });
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "do not have permission",
    );
    expect(mocks.definitions).not.toHaveBeenCalled();
  });

  it("creates a definition and opens its detail route", async () => {
    mocks.create.mockResolvedValue(definition);
    mount("new");
    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "Service charge" },
    });
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "15000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create charge" }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/admin/charges/definitions/charge",
      ),
    );
  });

  it("opens assignment actions without duplicate definitions", async () => {
    mount("definition");
    expect(
      await screen.findByRole("link", { name: /Harbour House/ }),
    ).toHaveAttribute("href", "/admin/charges/assignments/assignment");
    expect(
      screen.getByRole("link", { name: "Assign to a property" }),
    ).toHaveAttribute("href", "/admin/charges/definitions/charge/assign");
  });

  it("requires a target and responsible party before creating an assignment", async () => {
    mocks.assign.mockResolvedValue(assignment);
    mount("assign");
    expect(
      await screen.findByRole("button", { name: "Create assignment" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Choose Target property or space",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Choose Responsible person or organization",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Create assignment" }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/admin/charges/assignments/assignment",
      ),
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
    expect(screen.getByText("scheduled")).toBeInTheDocument();
  });

  it("reviews and transfers an unpaid responsibility", async () => {
    mocks.transfer.mockResolvedValue({});
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    mount("assignment", "assignment");

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Choose New responsible person or organization",
      }),
    );
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Occupancy changed" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Review and transfer" }),
    );

    await waitFor(() =>
      expect(mocks.transfer).toHaveBeenCalledWith("assignment", {
        responsible_party_id: "selected-party",
        expected_responsibility_id: "responsibility",
        reason: "Occupancy changed",
      }),
    );
    expect(confirm).toHaveBeenCalledOnce();
    confirm.mockRestore();
  });

  it("generates additional schedules for an assignment", async () => {
    mocks.generate.mockResolvedValue([]);

    mount("assignment", "assignment");

    fireEvent.change(await screen.findByLabelText("Schedules"), {
      target: { value: "3" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Generate schedules" }),
    );

    await waitFor(() =>
      expect(mocks.generate).toHaveBeenCalledWith("assignment", {
        schedule_count: 3,
      }),
    );
  });
});
