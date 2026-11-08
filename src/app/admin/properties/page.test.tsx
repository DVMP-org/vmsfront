import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import Workspace from "@/features/properties/PropertiesWorkspace";
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
  profile: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  move: vi.fn(),
  toggle: vi.fn(),
  catalog: vi.fn(),
  org: { id: "org", name: "Harbour", use_case: "mixed_use" },
  property: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
  usePathname: () => "/admin/properties",
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (s: any) =>
    s({ organization: mocks.org, setSelectedProperty: mocks.property }),
}));
vi.mock("@/store/auth-store", () => ({
  useAuthStore: (s: any) => s({ user: { id: "user" } }),
}));
vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
}));
vi.mock("@/features/context/api", () => ({
  contextApi: { catalog: mocks.catalog },
}));
vi.mock("@/features/properties/api", () => ({
  propertiesApi: mocks,
  propertyKinds: {
    site: "Site / property",
    building: "Building",
    unit: "Unit",
    room: "Room",
    space: "Space",
  },
}));
vi.mock("@/components/facets/FacetPicker", () => ({ FacetPicker: () => null }));
const record = {
  id: "one",
  name: "Harbour House",
  kind: "building",
  parent_id: null,
  is_active: true,
  address: "Main street",
  description: "",
  updated_at: "1",
  ancestors: [],
  children: [
    { id: "child", name: "Apartment A", kind: "unit", is_active: true },
  ],
};
function mount(route = {}) {
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
      <Workspace route={route} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.searchParams = new URLSearchParams();
  mocks.profile.mockResolvedValue({ data: { effective_permissions: ["*"] } });
  mocks.list.mockResolvedValue({
    items: [record],
    page: 1,
    total_pages: 1,
    total: 1,
  });
  mocks.get.mockResolvedValue(record);
  mocks.catalog.mockResolvedValue({
    use_cases: [{ value: "mixed_use", label: "Mixed use" }],
    building_types: [
      { value: "apartment", label: "Apartment", kinds: ["unit"] },
    ],
  });
});
it("opens property records and creation as actual page routes", async () => {
  mount();
  fireEvent.click(await screen.findByRole("button", { name: /Harbour House/ }));
  expect(mocks.push).toHaveBeenCalledWith("/admin/properties/one");
  fireEvent.click(screen.getByRole("button", { name: "New property" }));
  expect(mocks.push).toHaveBeenCalledWith("/admin/properties/new");
});
it("supports direct detail links and hierarchy drill down", async () => {
  mount({ id: "one" });
  fireEvent.click(await screen.findByRole("button", { name: /Apartment A/ }));
  expect(mocks.push).toHaveBeenCalledWith("/admin/properties/child");
  fireEvent.click(screen.getByRole("button", { name: "Add child space" }));
  expect(mocks.push).toHaveBeenCalledWith("/admin/properties/new?parent=one");
});
it("opens edit and move on dedicated routes", async () => {
  mount({ id: "one" });
  fireEvent.click(await screen.findByRole("button", { name: "Edit details" }));
  expect(mocks.push).toHaveBeenCalledWith("/admin/properties/one/edit");
  fireEvent.click(
    screen.getByRole("button", { name: "Move property or space" }),
  );
  expect(mocks.push).toHaveBeenCalledWith("/admin/properties/one/move");
});
it("offers site creation and derives classification from catalog", async () => {
  mount({ action: "new" });
  const kind = await screen.findByRole("combobox", { name: /Structure type/ });
  expect(kind).toHaveValue("site");
  expect(kind).toContainHTML('value="site"');
  fireEvent.change(kind, { target: { value: "unit" } });
  await screen.findByRole("option", { name: "Apartment" });
});
it("creates an additional top-level site without building type", async () => {
  mocks.create.mockResolvedValue({
    ...record,
    kind: "site",
    name: "Second estate",
  });
  mount({ action: "new" });
  fireEvent.change(await screen.findByLabelText(/Property name/), {
    target: { value: "Second estate" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create property" }));
  await waitFor(() =>
    expect(mocks.create).toHaveBeenCalledWith({
      name: "Second estate",
      kind: "site",
      building_type: null,
      use_case: null,
      address: "",
      description: "",
      parent_id: null,
    }),
  );
});
it("does not PATCH immutable kind or classification", async () => {
  mocks.update.mockResolvedValue(record);
  mount({ id: "one", action: "edit" });
  const name = await screen.findByRole("textbox", { name: /Property name/ });
  fireEvent.change(name, { target: { value: "Harbour Renamed" } });
  expect(screen.queryByRole("combobox", { name: /Structure type/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save details" }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith("one", {
      name: "Harbour Renamed",
      address: "Main street",
      description: "",
    }),
  );
  expect(mocks.push).toHaveBeenCalledWith("/admin/properties/one");
});
it("rejects direct action pages without grants", async () => {
  mocks.profile.mockResolvedValue({
    data: { effective_permissions: ["places.list", "places.show"] },
  });
  mount({ id: "one", action: "edit" });
  await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: "Save details" })).toBeNull();
});
it("retains edit values when API reports a conflict", async () => {
  mocks.update.mockRejectedValue(new Error("Duplicate name"));
  mount({ id: "one", action: "edit" });
  fireEvent.change(await screen.findByLabelText(/Property name/), {
    target: { value: "New name" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save details" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText(/Property name/)).toHaveValue("New name");
  expect(mocks.push).not.toHaveBeenCalled();
});
it("requires status confirmation and refetches after save", async () => {
  mocks.toggle.mockResolvedValue({ ...record, is_active: false });
  mount({ id: "one" });
  fireEvent.click(
    await screen.findByRole("button", { name: "Archive", exact: true }),
  );
  expect(mocks.toggle).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Archive property" }));
  await waitFor(() => expect(mocks.toggle).toHaveBeenCalledWith("one", false));
});
it("shows failed and empty directory states with retry", async () => {
  mocks.list.mockRejectedValueOnce(new Error("offline"));
  mount();
  const retry = await screen.findByRole("button", { name: "Retry" });
  mocks.list.mockResolvedValue({
    items: [],
    page: 1,
    total_pages: 0,
    total: 0,
  });
  fireEvent.click(retry);
  expect(
    (await screen.findAllByText("No properties found")).length,
  ).toBeGreaterThan(1);
});
it("opens property context with an explicit workspace action", async () => {
  mount({ id: "one" });
  fireEvent.click(
    await screen.findByRole("button", { name: "Open workspace" }),
  );
  expect(mocks.property).toHaveBeenCalledWith({
    id: "one",
    name: "Harbour House",
  });
  expect(mocks.push).toHaveBeenCalledWith("/admin");
});
it("opens the property people roster in the selected context", async () => {
  mount({ id: "one" });
  fireEvent.click(await screen.findByRole("button", { name: "Manage people" }));
  expect(mocks.property).toHaveBeenCalledWith({
    id: "one",
    name: "Harbour House",
  });
  expect(mocks.push).toHaveBeenCalledWith("/admin/people");
});
it("shows the third setup step while creating the first place", async () => {
  mount({ action: "new", setup: "first-place" });
  await screen.findByLabelText(/Property name/);
  expect(
    screen.getByRole("list", { name: "Organization setup progress" }),
  ).toHaveTextContent("Workspace");
  expect(screen.getByText("Workspace")).toHaveAttribute("aria-current", "step");
});

it("restores shareable directory filters from the URL", async () => {
  mocks.searchParams = new URLSearchParams(
    "page=2&search=Harbour&kind=building&status=all&all_levels=true",
  );
  mount();
  await screen.findByRole("button", { name: "Open Harbour House" });
  expect(mocks.list).toHaveBeenCalledWith({
    page: 2,
    page_size: 10,
    search: "Harbour",
    kind: "building",
    root_only: false,
  });
  expect(
    screen.getByRole("searchbox", { name: "Search properties" }),
  ).toHaveValue("Harbour");
  expect(screen.getByRole("combobox", { name: "Type" })).toHaveValue(
    "building",
  );
  expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("all");
});

it("writes filters and pagination into the URL and exposes labelled mobile rows", async () => {
  mount();
  const open = await screen.findByRole("button", {
    name: "Open Harbour House",
  });
  expect(open).toBeInTheDocument();
  expect(
    screen.getByRole("table", { name: "Properties register" }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
    target: { value: "archived" },
  });
  expect(mocks.replace).toHaveBeenCalledWith(
    "/admin/properties?status=archived",
    { scroll: false },
  );
  expect(screen.getAllByText("Structure").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Location").length).toBeGreaterThan(0);
});

it("keeps the previous rows visible when a filtered refresh fails", async () => {
  mocks.list
    .mockResolvedValueOnce({
      items: [record],
      page: 1,
      total_pages: 1,
      total: 1,
    })
    .mockRejectedValueOnce(new Error("offline"));
  mount();
  await screen.findByRole("button", { name: "Open Harbour House" });
  fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
    target: { value: "archived" },
  });
  await screen.findByText(/latest update failed/i);
  expect(
    screen.getByRole("button", { name: "Open Harbour House" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Retry update" }),
  ).toBeInTheDocument();
});

it("blocks invalid creation with a linked error summary and preserves the draft", async () => {
  mount({ action: "new" });

  fireEvent.change(await screen.findByLabelText(/Property name/), {
    target: { value: "   " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create property" }));

  const summary = await screen.findByRole("alert");
  expect(summary).toHaveTextContent("Enter a property name.");
  expect(screen.getByLabelText(/Property name/)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(mocks.create).not.toHaveBeenCalled();
});

it("moves a property to the organization root through the move workflow", async () => {
  mocks.move.mockResolvedValue({ ...record, parent_id: null });
  mount({ id: "one", action: "move" });

  fireEvent.click(
    await screen.findByLabelText(/Make this a top-level property/),
  );
  fireEvent.click(screen.getByRole("button", { name: "Move here" }));

  await waitFor(() => expect(mocks.move).toHaveBeenCalledWith("one", null));
});

it("keeps archive confirmation in a labelled dialog until confirmed", async () => {
  mount({ id: "one" });

  fireEvent.click(
    await screen.findByRole("button", { name: "Archive", exact: true }),
  );
  expect(
    screen.getByRole("dialog", { name: "Archive this property?" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Keep current status" }));

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(mocks.toggle).not.toHaveBeenCalled();
});
