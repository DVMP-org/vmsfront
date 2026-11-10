import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { PlaceGroupsWorkspace } from "./PlaceGroupsWorkspace";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  places: vi.fn(),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({ selectedProperty: { id: "site-1" } }),
}));
vi.mock("@/features/context/use-site-access", () => ({
  useSiteAccess: () => ({ allowed: () => true }),
}));
vi.mock("@/features/properties/api", () => ({
  propertiesApi: { list: mocks.places },
}));
vi.mock("./api", () => ({
  placeGroupsApi: {
    list: mocks.list,
    update: mocks.update,
    create: mocks.create,
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("place group editor", () => {
  it("opens a side drawer with the selected group and resets for a new group", async () => {
    mocks.list.mockResolvedValue([
      {
        id: "group-1",
        name: "Default",
        description: "Existing group",
        places: [{ id: "unit-1", name: "APT 01" }],
      },
    ]);
    mocks.places.mockResolvedValue({
      items: [{ id: "unit-1", name: "APT 01", kind: "unit" }],
    });
    mocks.update.mockResolvedValue({});
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <PlaceGroupsWorkspace />
      </QueryClientProvider>,
    );
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Edit" }))[0],
    );
    const drawer = screen.getByRole("dialog", { name: "Edit Default" });
    expect(within(drawer).getByLabelText(/Group name/)).toHaveValue("Default");
    expect(within(drawer).getByLabelText(/APT 01/)).toBeChecked();
    fireEvent.change(within(drawer).getByLabelText(/Group name/), {
      target: { value: "Updated" },
    });
    fireEvent.click(within(drawer).getByRole("button", { name: "Save group" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith("group-1", {
        name: "Updated",
        description: "Existing group",
        place_ids: ["unit-1"],
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Create group" }));
    const createDrawer = screen.getByRole("dialog", {
      name: "Create Place group",
    });
    expect(within(createDrawer).getByLabelText(/Group name/)).toHaveValue("");
    expect(within(createDrawer).getByLabelText(/APT 01/)).not.toBeChecked();
  });
});
