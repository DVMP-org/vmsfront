import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, it, expect, beforeEach } from "vitest";
import Page from "./page";
const identity = vi.hoisted(() => ({ organizationId: "org", userId: "user" }));
const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  move: vi.fn(),
  toggle: vi.fn(),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (select: any) =>
    select({ organization: { id: identity.organizationId } }),
}));
vi.mock("@/store/auth-store", () => ({
  useAuthStore: (select: any) => select({ user: { id: identity.userId } }),
}));
vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
}));
vi.mock("@/features/properties/api", async () => ({
  ...(await vi.importActual("@/features/properties/api")),
  propertiesApi: mocks,
}));
vi.mock("@/components/facets/FacetPicker", () => ({
  FacetPicker: ({ label, onChange }: any) => (
    <button
      type="button"
      onClick={() =>
        onChange({
          value: "destination",
          label: "North Property",
          disabled: false,
          meta: { kind: "site", slug: "north", parent_id: null },
        })
      }
    >
      {label}
    </button>
  ),
}));
const child = {
  id: "child",
  name: "East Building",
  kind: "building",
  parent_id: "root",
  description: null,
  address: "",
  is_active: true,
  updated_at: "2027-01-01T00:00:00Z",
};
const root = {
  id: "root",
  name: "Harbour Property",
  kind: "building",
  parent_id: null,
  description: "Property operations",
  address: "Main Street",
  is_active: true,
  updated_at: "2027-01-01T00:00:00Z",
  ancestors: [],
  children: [child],
};
function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <Page />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  identity.organizationId = "org";
  identity.userId = "user";
  mocks.profile.mockResolvedValue({ data: { role: { permissions: ["*"] } } });
  mocks.list.mockResolvedValue({
    items: [root],
    total: 1,
    page: 1,
    total_pages: 1,
  });
  mocks.get.mockImplementation(async (id) =>
    id === "root" ? root : { ...child, ancestors: [root], children: [] },
  );
});
it("shows errors and retries into an explicit empty state", async () => {
  mocks.list.mockRejectedValueOnce(new Error("unavailable"));
  mount();
  const retry = await screen.findByRole("button", { name: "Retry" });
  mocks.list.mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    total_pages: 0,
  });
  fireEvent.click(retry);
  await screen.findByText("No properties found");
});
it("filters the resource list and resets pagination", async () => {
  mount();
  await screen.findByRole("button", { name: /Harbour Property Active/ });
  fireEvent.change(screen.getByLabelText("Search properties"), {
    target: { value: "Harbour" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "Harbour", page: 1, root_only: true }),
    ),
  );
  fireEvent.change(screen.getByLabelText("Type", { selector: "select" }), {
    target: { value: "building" },
  });
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "building" }),
    ),
  );
});
it("navigates children and ancestor breadcrumbs without exposing IDs", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: /East Building Building/ }),
  );
  await screen.findByRole("heading", { name: "East Building" });
  fireEvent.click(
    screen
      .getByRole("navigation", { name: "Property hierarchy" })
      .querySelector("button")!,
  );
  await screen.findByRole("heading", { name: "Harbour Property" });
  expect(mocks.get).toHaveBeenCalledWith("child");
});
it("hides mutations for read-only roles", async () => {
  mocks.profile.mockResolvedValue({
    data: { role: { permissions: ["places.list", "places.show"] } },
  });
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  await screen.findByRole("heading", { name: "Harbour Property" });
  expect(
    screen.queryByRole("button", { name: "New property or space" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Edit details" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Archive", exact: true }),
  ).toBeNull();
});
it("requires explicit status confirmation and surfaces blocked archives", async () => {
  mocks.toggle.mockRejectedValue({
    isAxiosError: true,
    response: { data: { message: "Archive active child places first" } },
  });
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Archive", exact: true }),
  );
  expect(mocks.toggle).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm status change" }),
  );
  await screen.findByText("Archive active child places first");
  expect(mocks.toggle).toHaveBeenCalledWith("root", false);
});
it("preserves edit inputs on a conflicting name", async () => {
  mocks.update.mockRejectedValue({
    isAxiosError: true,
    response: { data: { message: "A place with this name already exists" } },
  });
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  fireEvent.click(await screen.findByRole("button", { name: "Edit details" }));
  fireEvent.change(screen.getByLabelText("Name", { exact: true }), {
    target: { value: "North Property" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save details" }));
  await screen.findByText("A place with this name already exists");
  expect(screen.getByLabelText("Name", { exact: true })).toHaveValue(
    "North Property",
  );
});
it("creates a child with the current property selected", async () => {
  mocks.create.mockResolvedValue(child);
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Add child space" }),
  );
  fireEvent.change(screen.getByLabelText("Name", { exact: true }), {
    target: { value: "East Building" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Create property", exact: true }),
  );
  await waitFor(() =>
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "East Building",
        kind: "unit",
        parent_id: "root",
      }),
    ),
  );
  await screen.findByRole("heading", { name: "East Building" });
});
it("moves to the top level using the canonical null parent contract", async () => {
  mocks.move.mockResolvedValue(root);
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Move property or space" }),
  );
  fireEvent.click(screen.getByLabelText("Make this a top-level property"));
  fireEvent.click(screen.getByRole("button", { name: "Move here" }));
  await waitFor(() => expect(mocks.move).toHaveBeenCalledWith("root", null));
});

it("resets the child parent when starting a new top-level form", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Add child space" }),
  );
  expect(
    screen.getByLabelText("Place inside another property or space"),
  ).toBeChecked();
  fireEvent.click(
    screen.getByRole("button", { name: "New property or space" }),
  );
  expect(
    screen.getByLabelText("Place inside another property or space"),
  ).not.toBeChecked();
});
it("clears selected details and drafts when organization or user changes", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const element = () => (
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>
  );
  const view = render(element());
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  fireEvent.click(await screen.findByRole("button", { name: "Edit details" }));
  fireEvent.change(screen.getByLabelText("Name", { exact: true }), {
    target: { value: "Unsaved private draft" },
  });
  identity.organizationId = "second-org";
  identity.userId = "second-user";
  view.rerender(element());
  await screen.findByRole("region", { name: "Property list" });
  expect(screen.queryByDisplayValue("Unsaved private draft")).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Harbour Property" }),
  ).toBeNull();
});

it("does not offer organization site creation", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: "New property or space" }),
  );
  const types = screen.getByRole("combobox", { name: /Structure type/ });
  expect(types).toHaveValue("building");
  expect(types.querySelector('option[value="site"]')).toBeNull();
});
it("shows existing type as fixed and never patches it when editing", async () => {
  mocks.update.mockResolvedValue(root);
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  fireEvent.click(await screen.findByRole("button", { name: "Edit details" }));
  expect(screen.queryByRole("combobox", { name: /Structure type/ })).toBeNull();
  await screen.findByText(
    "This structure is fixed. Use Move to change where it belongs.",
  );
  fireEvent.click(screen.getByRole("button", { name: "Save details" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalled());
  expect(mocks.update.mock.calls[0][1]).not.toHaveProperty("kind");
});

it("treats the organization site as context rather than a movable or archivable space", async () => {
  const site = { ...root, kind: "site" };
  mocks.list.mockResolvedValue({
    items: [site],
    total: 1,
    page: 1,
    total_pages: 1,
  });
  mocks.get.mockResolvedValue(site);
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Harbour Property Active/ }),
  );
  await screen.findByRole("heading", { name: "Harbour Property" });
  expect(
    screen.queryByRole("button", { name: "Move property or space" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Archive", exact: true }),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Add child space" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Edit details" })).toBeEnabled();
});
