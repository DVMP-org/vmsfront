import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PeopleWorkspace from "./PeopleWorkspace";

const mocks = vi.hoisted(() => ({
  state: {
    organization: { id: "org", name: "Harbour" },
    selectedProperty: { id: "unit", name: "Apartment 4B" } as {
      id: string;
      name: string;
    } | null,
  },
  profile: {
    effective_permissions: ["parties.create", "place_relationships.create"],
  },
  get: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  setProperty: vi.fn(),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (value: unknown) => unknown) =>
    selector({
      ...mocks.state,
      setSelectedProperty: mocks.setProperty,
    }),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (value: unknown) => unknown) =>
    selector({ user: { id: "user" } }),
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminProfile: () => ({
    data: mocks.profile,
    isPending: false,
    isError: false,
  }),
}));

vi.mock("@/components/facets/FacetPicker", () => ({
  FacetPicker: ({
    onChange,
  }: {
    onChange: (item: { value: string; label: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onChange({ value: "selected-property", label: "Selected property" })
      }
    >
      Property picker
    </button>
  ),
}));

vi.mock("./api", () => ({ peopleApi: mocks }));

const people = {
  place: {
    id: "unit",
    name: "Apartment 4B",
    slug: "apartment-4b",
    kind: "unit",
    is_active: true,
  },
  effective_use_case: "residential" as const,
  administrators: [
    {
      assignment_id: "manager-assignment",
      party: {
        id: "manager",
        kind: "person",
        display_name: "Site Manager",
        email: "manager@example.test",
        is_active: true,
      },
      role: "place_admin",
      is_super_admin: false,
      status: "active",
      source: "administration" as const,
    },
  ],
  occupants: [
    {
      assignment_id: "resident-assignment",
      party: {
        id: "resident",
        kind: "person",
        display_name: "Ada Resident",
        email: "ada@example.test",
        is_active: true,
      },
      role: "resident",
      is_super_admin: true,
      status: "active",
      source: "occupancy" as const,
    },
  ],
};

function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PeopleWorkspace />
    </QueryClientProvider>,
  );
}

describe("property people", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.selectedProperty = { id: "unit", name: "Apartment 4B" };
    mocks.profile = {
      effective_permissions: ["parties.create", "place_relationships.create"],
    };
    mocks.get.mockResolvedValue(people);
  });

  it("separates property administrators from occupants", async () => {
    mount();

    expect((await screen.findAllByText("Site Manager")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Ada Resident").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Place Admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Primary").length).toBeGreaterThan(0);
    expect(screen.getByText("Property people")).toBeInTheDocument();
  });

  it("filters the register by administration or occupancy scope", async () => {
    mount();

    await screen.findAllByText("Site Manager");
    fireEvent.click(screen.getByRole("button", { name: "Administrators" }));
    expect(screen.getAllByText("Site Manager").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Ada Resident")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Occupants" }));
    expect(screen.queryAllByText("Site Manager")).toHaveLength(0);
    expect(screen.getAllByText("Ada Resident").length).toBeGreaterThan(0);
  });

  it("adds an occupant from the contextual drawer and reports onboarding", async () => {
    mocks.add.mockResolvedValue({
      assignment_id: "assignment",
      role: "tenant",
      is_super_admin: false,
      status: "active",
      party: {
        ...people.occupants[0].party,
        id: "new-resident",
        organization_id: "org",
        user_id: "new-user",
        display_name: "New Resident",
      },
      place: people.place,
      onboarding_email: "queued",
      user_created: true,
    });
    mount();

    fireEvent.click(await screen.findByRole("button", { name: "Add person" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Add a person",
    });
    fireEvent.change(within(dialog).getByLabelText("Full name"), {
      target: { value: "New Resident" },
    });
    fireEvent.change(within(dialog).getByLabelText("Email"), {
      target: { value: "new@example.test" },
    });
    fireEvent.change(within(dialog).getByLabelText("Property relationship"), {
      target: { value: "tenant" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add person" }));

    await waitFor(() =>
      expect(mocks.add).toHaveBeenCalledWith("unit", {
        display_name: "New Resident",
        email: "new@example.test",
        kind: "person",
        role: "tenant",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "onboarding email has been queued",
    );
    expect(screen.queryByRole("dialog", { name: "Add a person" })).toBeNull();
  });

  it("reports linked validation before sending a new person", async () => {
    mount();

    fireEvent.click(await screen.findByRole("button", { name: "Add person" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Add a person",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add person" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Enter the person’s full name",
    );
    expect(within(dialog).getByLabelText("Full name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it("requires an explicit property context before loading a roster", async () => {
    mocks.state.selectedProperty = null;
    mount();

    expect(
      await screen.findByRole("heading", {
        name: "Choose a property to manage people",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Property picker" }));
    expect(mocks.setProperty).toHaveBeenCalledWith({
      id: "selected-property",
      name: "Selected property",
    });
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("ends an occupant assignment from the confirmation dialog", async () => {
    mocks.remove.mockResolvedValue({
      assignment_id: "resident-assignment",
      source: "occupancy",
      status: "ended",
    });
    mount();

    fireEvent.click(
      (
        await screen.findAllByRole("button", {
          name: "Review access change for Ada Resident",
        })
      )[0],
    );
    const dialog = await screen.findByRole("dialog", {
      name: "End property access?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "End access" }));

    await waitFor(() =>
      expect(mocks.remove).toHaveBeenCalledWith(
        "unit",
        "occupancy",
        "resident-assignment",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "property access has ended",
    );
  });

  it("renders the roster read-only without relationship management grants", async () => {
    mocks.profile = { effective_permissions: ["places.show"] };
    mount();

    expect((await screen.findAllByText("Site Manager")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Read-only").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Add person" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Review access change for Site Manager",
      }),
    ).not.toBeInTheDocument();
  });
});
