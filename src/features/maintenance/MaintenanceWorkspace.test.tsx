import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { MaintenanceWorkspace } from "./MaintenanceWorkspace";

const request = {
  id: "request-1",
  site_id: "site-1",
  place: { id: "unit-1", name: "Unit A1" },
  domain: "residential" as const,
  request_type: "request" as const,
  category: "plumbing",
  title: "Kitchen tap leak",
  description: "The kitchen tap is leaking continuously.",
  priority: "high" as const,
  status: "open" as const,
  assigned_to: null,
  reported_by: { id: "party-1", display_name: "Ada Resident" },
  contractor: null,
  approval_status: "not_required" as const,
  scheduled_for: null,
  due_at: null,
  resolved_at: null,
  closed_at: null,
  resolution_notes: null,
  cost_estimate: null,
  actual_cost: null,
  currency: "NGN",
  requires_access_authorization: true,
  affects_room_availability: false,
  expense_allocation_required: false,
  created_at: "2026-11-09T09:00:00Z",
  updated_at: "2026-11-09T09:00:00Z",
  activities: [],
};

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  tree: vi.fn(),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      selectedSite: { id: "site-1", name: "Harbour Heights" },
    }),
}));

vi.mock("@/features/context/use-site-access", () => ({
  useSiteAccess: () => ({
    workspace: {
      data: {
        management: { is_administrator: true },
        effective_permissions: ["*"],
      },
      isPending: false,
      isError: false,
      isFetchedAfterMount: true,
      refetch: vi.fn(),
    },
    contextKey: "org:site:user",
    allowed: () => true,
    isAdministrator: true,
  }),
}));

vi.mock("@/features/places/api", () => ({
  placesApi: { tree: mocks.tree },
}));

vi.mock("@/components/facets/FacetPicker", () => ({
  FacetPicker: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (item: {
      value: string;
      label: string;
      disabled: boolean;
      meta: { kind: string; user_linked: boolean };
    }) => void;
  }) => (
    <button
      type="button"
      aria-label={label}
      onClick={() =>
        onChange({
          value: "party-operator",
          label: "Facilities Engineer",
          disabled: false,
          meta: { kind: "person", user_linked: true },
        })
      }
    >
      {label}
    </button>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./api", () => ({
  maintenanceApi: {
    list: mocks.list,
    get: mocks.get,
    create: mocks.create,
    update: mocks.update,
  },
}));

function mount(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  );
}

describe("shared maintenance workspace", () => {
  beforeEach(() => {
    mocks.list.mockResolvedValue({ items: [request], total: 1 });
    mocks.get.mockResolvedValue({
      ...request,
      activities: [
        {
          id: "activity-1",
          event_type: "created",
          message: "Maintenance request created",
          actor: null,
          actor_site_admin: {
            id: "admin-1",
            user_id: "user-1",
            display_name: "Site Manager",
            email: "manager@example.test",
          },
          occurred_at: "2026-11-09T09:00:00Z",
        },
      ],
    });
    mocks.update.mockImplementation((_id, body) =>
      Promise.resolve({
        ...request,
        ...body,
        updated_at: "2026-11-09T10:00:00Z",
      }),
    );
    mocks.tree.mockResolvedValue([
      {
        id: "site-1",
        name: "Harbour Heights",
        kind: "site",
        children: [
          {
            id: "unit-1",
            name: "Unit A1",
            kind: "unit",
            children: [],
          },
        ],
      },
    ]);
  });

  it("shows the site admin creator when no reporter was specified", async () => {
    mocks.list.mockResolvedValue({
      items: [
        {
          ...request,
          reported_by: null,
          created_by_site_admin: {
            id: "admin-1",
            user_id: "user-1",
            display_name: "Site Manager",
            avatar_url: "https://example.test/avatar.png",
          },
        },
      ],
      total: 1,
    });
    mount(<MaintenanceWorkspace domain="residential" />);
    expect((await screen.findAllByText("Site Manager")).length).toBeGreaterThan(
      0,
    );
    expect(
      screen
        .getAllByRole("img", { hidden: true })
        .some((image) => image.getAttribute("src")?.includes("avatar.png")),
    ).toBe(true);
  });

  it("creates a request for the selected site", async () => {
    mocks.create.mockResolvedValue(request);
    mount(<MaintenanceWorkspace domain="residential" />);
    fireEvent.click(await screen.findByRole("button", { name: "New request" }));
    fireEvent.change(await screen.findByLabelText(/Space \/ zone/), {
      target: { value: "unit-1" },
    });
    fireEvent.change(screen.getByLabelText(/^Title/), {
      target: { value: "Leaking tap" },
    });
    fireEvent.change(screen.getByLabelText(/^Description/), {
      target: { value: "The tap is leaking continuously." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create request" }));
    await waitFor(() =>
      expect(mocks.create.mock.calls.at(-1)?.[0]).toEqual(
        expect.objectContaining({ site_id: "site-1", place_id: "unit-1" }),
      ),
    );
    expect(mocks.create.mock.calls.at(-1)?.[0]).not.toHaveProperty(
      "property_place_id",
    );
  });

  it("loads SiteAdmin activity and updates assignment, schedule and workflow", async () => {
    mount(<MaintenanceWorkspace domain="residential" />);

    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Review" }))[0],
    );

    expect(await screen.findByText("Site Manager")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Assigned operator" }));
    fireEvent.change(screen.getByLabelText("Workflow status"), {
      target: { value: "in_progress" },
    });
    fireEvent.change(screen.getByLabelText("Scheduled visit"), {
      target: { value: "2026-11-10T09:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        "request-1",
        expect.objectContaining({
          status: "in_progress",
          assigned_to_party_id: "party-operator",
          scheduled_for: expect.any(String),
        }),
      ),
    );
  });
});
