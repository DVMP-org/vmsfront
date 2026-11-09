import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExpenseAllocations } from "@/features/mixed-use/ExpenseAllocations";
import { SharedFacilities } from "@/features/mixed-use/SharedFacilities";
import { mixedUseApi } from "@/features/mixed-use/api";
import { propertiesApi } from "@/features/properties/api";

const access = vi.hoisted(() => ({
  canManageFacilities: true,
  canManageExpenses: true,
}));

vi.mock("@/features/mixed-use/MixedUseShell", () => ({
  MixedUseShell: ({
    children,
    primaryAction,
  }: {
    children: React.ReactNode;
    primaryAction?: React.ReactNode;
  }) => (
    <>
      {primaryAction}
      {children}
    </>
  ),
  useMixedUseAccess: () => ({
    profile: { isError: false, refetch: vi.fn() },
    organization: { id: "org", name: "Harbour Group" },
    selectedProperty: { id: "place-1", name: "Harbour Complex" },
    contextKey: "org:user",
    ...access,
  }),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: {
      selectedProperty: { id: string; name: string };
    }) => unknown,
  ) =>
    selector({
      selectedProperty: { id: "place-1", name: "Harbour Complex" },
    }),
}));

vi.mock("@/features/mixed-use/api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/mixed-use/api")
  >("@/features/mixed-use/api");
  return {
    ...actual,
    mixedUseApi: {
      listFacilities: vi.fn(),
      createFacility: vi.fn(),
      updateFacility: vi.fn(),
      listAllocations: vi.fn(),
      createAllocation: vi.fn(),
      approveAllocation: vi.fn(),
      archiveAllocation: vi.fn(),
    },
  };
});

vi.mock("@/features/properties/api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/properties/api")
  >("@/features/properties/api");
  return {
    ...actual,
    propertiesApi: {
      ...actual.propertiesApi,
      tree: vi.fn().mockResolvedValue([]),
    },
  };
});

const facility = {
  id: "facility-1",
  organization_id: "org",
  place_id: "place-1",
  name: "Residents lounge",
  facility_type: "amenity" as const,
  description: "Shared lounge for every operating domain.",
  capacity: 40,
  is_active: true,
  created_at: "2026-11-09T00:00:00Z",
  updated_at: "2026-11-09T00:00:00Z",
};

const allocation = {
  id: "allocation-1",
  organization_id: "org",
  place_id: "place-1",
  title: "Shared security",
  description: "Quarterly common-area security.",
  period_start: "2027-01-01",
  period_end: "2027-03-31",
  total_amount: "120000.00",
  currency: "NGN",
  status: "draft" as const,
  shares: [
    {
      id: "share-1",
      organization_id: "org",
      allocation_id: "allocation-1",
      target_place_id: null,
      use_case: "residential" as const,
      label: "Residential",
      percentage: "50.00",
      amount: "60000.00",
      created_at: "2026-11-09T00:00:00Z",
      updated_at: "2026-11-09T00:00:00Z",
    },
    {
      id: "share-2",
      organization_id: "org",
      allocation_id: "allocation-1",
      target_place_id: null,
      use_case: "commercial" as const,
      label: "Commercial",
      percentage: "50.00",
      amount: "60000.00",
      created_at: "2026-11-09T00:00:00Z",
      updated_at: "2026-11-09T00:00:00Z",
    },
  ],
  created_at: "2026-11-09T00:00:00Z",
  updated_at: "2026-11-09T00:00:00Z",
};

function renderPage(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{node}</QueryClientProvider>,
  );
}

describe("mixed-use pages", () => {
  beforeEach(() => {
    access.canManageFacilities = true;
    access.canManageExpenses = true;
    vi.mocked(propertiesApi.tree).mockResolvedValue([]);
    vi.mocked(mixedUseApi.listFacilities).mockResolvedValue({
      items: [facility],
      total: 1,
      page: 1,
      page_size: 100,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });
    vi.mocked(mixedUseApi.createFacility).mockResolvedValue({
      ...facility,
      id: "facility-2",
      name: "Business lounge",
    });
    vi.mocked(mixedUseApi.listAllocations).mockResolvedValue({
      items: [allocation],
      total: 1,
      page: 1,
      page_size: 100,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });
    vi.mocked(mixedUseApi.createAllocation).mockResolvedValue(allocation);
  });

  it("creates a shared facility inside the selected property", async () => {
    renderPage(<SharedFacilities />);

    expect((await screen.findAllByText("Residents lounge"))[0]).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add facility" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Facility name"), {
      target: { value: "Business lounge" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add facility" }),
    );

    await waitFor(() =>
      expect(mixedUseApi.createFacility).toHaveBeenCalledWith(
        "place-1",
        expect.objectContaining({
          name: "Business lounge",
          facility_type: "amenity",
        }),
      ),
    );
  });

  it("creates a draft allocation with the configured domain split", async () => {
    renderPage(<ExpenseAllocations />);

    expect((await screen.findAllByText("Shared security"))[0]).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "New allocation" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Expense title"), {
      target: { value: "Shared utilities" },
    });
    fireEvent.change(within(dialog).getByLabelText("Total amount"), {
      target: { value: "50000" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create draft" }),
    );

    await waitFor(() =>
      expect(mixedUseApi.createAllocation).toHaveBeenCalledWith(
        "place-1",
        expect.objectContaining({
          title: "Shared utilities",
          total_amount: "50000.00",
          shares: [
            expect.objectContaining({
              use_case: "residential",
              percentage: "50.00",
            }),
            expect.objectContaining({
              use_case: "commercial",
              percentage: "50.00",
            }),
          ],
        }),
      ),
    );
  });
});
