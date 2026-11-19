import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChargeRegister } from "./ChargeRegister";
import { chargesApi } from "./api";

vi.mock("@/features/context/use-site-access", () => ({
  useSiteAccess: () => ({
    contextKey: "organization:site-1:user",
    workspace: { isPending: false, isError: false },
    allowed: () => true,
  }),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: {
      selectedSite: { id: string; name: string };
    }) => unknown,
  ) => selector({ selectedSite: { id: "site-1", name: "Harbour Homes" } }),
}));

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return {
    ...actual,
    chargesApi: { ...actual.chargesApi, allSchedules: vi.fn() },
  };
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ChargeRegister />
    </QueryClientProvider>,
  );
}

describe("charge register", () => {
  beforeEach(() => {
    vi.mocked(chargesApi.allSchedules).mockResolvedValue({
      items: [
        {
          id: "schedule-1",
          charge_assignment_id: "assignment-1",
          due_date: "2026-12-01T00:00:00Z",
          amount: "120.00",
          amount_paid: "20.00",
          balance: "100.00",
          currency: "NGN",
          status: "scheduled",
          charge_definition: {
            id: "definition-1",
            site_id: "site-1",
            name: "Service charge",
            description: null,
            amount: "120.00",
            currency: "NGN",
            recurrence: "monthly",
            is_active: true,
          },
          target_place: { id: "unit-1", name: "Unit 1" },
          current_responsibility: null,
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });
  });

  it("shows schedule amounts and filters by status", async () => {
    renderPage();
    expect((await screen.findAllByText("Service charge"))[0]).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Charge register" }),
    ).toBeVisible();
    expect(screen.getByText("Billed schedules")).toBeVisible();
    expect(chargesApi.allSchedules).toHaveBeenCalledWith(1, undefined);

    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
      target: { value: "paid" },
    });
    await waitFor(() =>
      expect(chargesApi.allSchedules).toHaveBeenCalledWith(1, "paid"),
    );
  });
});
