import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { PlaceAssignmentModal } from "./PlaceAssignmentModal";

const create = vi.hoisted(() => vi.fn());
vi.mock("./api", () => ({ placeRelationshipsApi: { create } }));
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
