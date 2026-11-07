import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <PeopleWorkspace />
    </QueryClientProvider>,
  );
}

describe("property people", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.selectedProperty = { id: "unit", name: "Apartment 4B" };
    mocks.get.mockResolvedValue(people);
  });

  it("separates property administrators from occupants", async () => {
    mount();

    expect(await screen.findByText("Site Manager")).toBeInTheDocument();
    expect(screen.getByText("Ada Resident")).toBeInTheDocument();
    expect(screen.getByText("Place Admin")).toBeInTheDocument();
    expect(screen.getByText("Resident · Primary")).toBeInTheDocument();
    expect(
      screen.getByText("Property administrators"),
    ).toBeInTheDocument();
  });

  it("adds an occupant with a valid use-case role and reports onboarding", async () => {
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

    fireEvent.change(await screen.findByLabelText("Full name"), {
      target: { value: "New Resident" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new@example.test" },
    });
    fireEvent.change(screen.getByLabelText(/Role in this property/), {
      target: { value: "tenant" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Add person and prepare onboarding",
      }),
    );

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

  it("ends an occupant assignment after manager confirmation", async () => {
    mocks.remove.mockResolvedValue({
      assignment_id: "resident-assignment",
      source: "occupancy",
      status: "ended",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mount();

    fireEvent.click(
      await screen.findByRole("button", { name: "End access" }),
    );

    await waitFor(() =>
      expect(mocks.remove).toHaveBeenCalledWith(
        "unit",
        "occupancy",
        "resident-assignment",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "access to this property has ended",
    );
  });
});
