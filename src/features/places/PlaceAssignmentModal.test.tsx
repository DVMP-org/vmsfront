import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { PlaceAssignmentModal } from "./PlaceAssignmentModal";

const create = vi.hoisted(() => vi.fn());
const createParty = vi.hoisted(() => vi.fn());
const createLease = vi.hoisted(() => vi.fn());
vi.mock("./api", () => ({ placeRelationshipsApi: { create } }));
vi.mock("@/features/parties/api", () => ({
  partiesApi: { create: createParty },
}));
vi.mock("@/features/leases/api", async () => {
  const actual = await vi.importActual<object>("@/features/leases/api");
  return { ...actual, leasesApi: { create: createLease } };
});
vi.mock("@/features/people/api", () => ({ peopleApi: { add: vi.fn() } }));
vi.mock("@/components/facets/FacetPicker", () => ({
  FacetPicker: ({ onChange }: any) => (
    <button
      type="button"
      onClick={() => onChange({ value: "party", label: "Resident" })}
    >
      Select resident
    </button>
  ),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

it("assigns dates at local midnight and refreshes workspace memberships", async () => {
  create.mockResolvedValue({ id: "relationship" });
  const client = new QueryClient();
  client.setQueryData(["auth", "verify", "org", "user"], { workspaces: [] });
  render(
    <QueryClientProvider client={client}>
      <PlaceAssignmentModal
        open
        siteId="site"
        contextKey="org:site"
        places={[{ id: "unit", name: "APT 01" }]}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Select resident" }));
  fireEvent.change(screen.getByLabelText("Starts"), {
    target: { value: "2026-11-10" },
  });
  fireEvent.change(screen.getByLabelText("Lease / occupancy ends"), {
    target: { value: "2027-03-23" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Assign relationship" }));
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        party_id: "party",
        place_id: "unit",
        effective_from: new Date(2026, 10, 10).toISOString(),
        effective_to: new Date(2027, 2, 23).toISOString(),
      }),
    ),
  );
  await waitFor(() =>
    expect(
      client.getQueryState(["auth", "verify", "org", "user"])?.isInvalidated,
    ).toBe(true),
  );
});

it("creates a business Party and attaches it for commercial spaces", async () => {
  create.mockResolvedValue({ id: "relationship" });
  createParty.mockResolvedValue({ id: "party-new", kind: "organization" });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PlaceAssignmentModal
        open
        siteId="site"
        contextKey="org:site"
        places={[{ id: "suite", name: "Suite 4A" }]}
        closedPlaceName="Suite 4A"
        useCase="commercial"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryClientProvider>,
  );

  // The fixed place is shown as text instead of a one-option select.
  expect(screen.getByText("Suite 4A")).toBeInTheDocument();
  expect(screen.queryByLabelText("Commercial space")).not.toBeInTheDocument();
  const roleSelect = screen.getByRole("combobox");
  expect(roleSelect.querySelector("option[value=tenant]")).not.toBeNull();
  expect(roleSelect.querySelector("option[value=resident]")).toBeNull();

  fireEvent.click(
    screen.getByRole("radio", { name: "New business Party" }),
  );
  fireEvent.change(screen.getByLabelText(/Full name/), {
    target: { value: "Acme Studio" },
  });
  fireEvent.change(screen.getByLabelText(/Email address/), {
    target: { value: "lease@acme.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add party" }));

  await waitFor(() =>
    expect(createParty).toHaveBeenCalledWith({
      kind: "organization",
      display_name: "Acme Studio",
      email: "lease@acme.test",
      phone: null,
    }),
  );
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        party_id: "party-new",
        place_id: "suite",
        role: "tenant",
        status: "active",
      }),
    ),
  );
});

it("drafts the lease from the add-party flow, after the party is attached", async () => {
  create.mockResolvedValue({ id: "relationship" });
  createParty.mockResolvedValue({ id: "party-new", kind: "organization" });
  createLease.mockResolvedValue({ id: "lease" });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PlaceAssignmentModal
        open
        siteId="site"
        contextKey="org:site"
        places={[{ id: "suite", name: "Suite 4A" }]}
        closedPlaceName="Suite 4A"
        useCase="commercial"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole("radio", { name: "New business Party" }));
  fireEvent.change(screen.getByLabelText(/Full name/), {
    target: { value: "Acme Studio" },
  });
  fireEvent.change(screen.getByLabelText(/Email address/), {
    target: { value: "lease@acme.test" },
  });
  fireEvent.click(
    screen.getByRole("switch", { name: "Also draft a lease for this party" }),
  );
  fireEvent.change(screen.getByLabelText(/Rent per period/), {
    target: { value: "450000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add party" }));

  await waitFor(() =>
    expect(createLease).toHaveBeenCalledWith(
      expect.objectContaining({
        party_id: "party-new",
        place_id: "suite",
        kind: "lease",
        rent_amount: "450000",
        rent_cadence: "monthly",
        charge_lines: [
          expect.objectContaining({
            name: "Rent",
            amount: "450000",
            recurrence: "monthly",
            create_definition: false,
          }),
        ],
      }),
    ),
  );
  // The party occupies the space before any lease is drafted for it.
  expect(create.mock.invocationCallOrder[0]).toBeLessThan(
    createLease.mock.invocationCallOrder[0],
  );
});

it("does not touch leases when the toggle stays off", async () => {
  create.mockResolvedValue({ id: "relationship" });
  createLease.mockClear();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PlaceAssignmentModal
        open
        siteId="site"
        contextKey="org:site"
        places={[{ id: "unit", name: "APT 01" }]}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Select resident" }));
  fireEvent.click(screen.getByRole("button", { name: "Assign relationship" }));
  await waitFor(() => expect(create).toHaveBeenCalled());
  expect(createLease).not.toHaveBeenCalled();
});
