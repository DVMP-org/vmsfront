import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResidentialFinance, { ResidentialArrears } from "./ResidentialFinance";
import { residentialApi } from "./api";
import type { Assignment } from "@/features/charges/api";
import type { PlaceTreeNode } from "@/features/places/api";

vi.mock("./ResidentialShell", () => ({
  ResidentialShell: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
  useResidentialAccess: () => ({
    contextKey: "site:user",
    selectedSite: { id: "site-1", name: "Harbour Homes" },
    canManageFinance: true,
  }),
}));

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return {
    ...actual,
    residentialApi: {
      ...actual.residentialApi,
      tree: vi.fn(),
      chargeAssignments: vi.fn(),
    },
  };
});

const tree = [
  {
    id: "site-1",
    children: [
      { id: "unit-1", name: "Unit 1", children: [] },
      { id: "unit-2", name: "Unit 2", children: [] },
    ],
  },
] as PlaceTreeNode[];

function assignment(
  id: string,
  target: string,
  currency: string,
  amount: string,
  due: string,
): Assignment {
  return {
    id,
    charge_definition_id: `definition-${id}`,
    charge_definition: {
      id: `definition-${id}`,
      site_id: "site-1",
      name: `Charge ${id}`,
      description: null,
      amount,
      currency,
      recurrence: "monthly",
      is_active: true,
    },
    target_place: {
      id: target,
      name: target === "unit-1" ? "Unit 1" : "Unit 2",
    },
    current_responsibility: null,
    outstanding_amount: amount,
    next_due_date: due,
    status: "active",
  };
}

function renderPage(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{node}</QueryClientProvider>,
  );
}

describe("residential Finance views", () => {
  beforeEach(() => {
    vi.mocked(residentialApi.tree).mockResolvedValue(tree);
    vi.mocked(residentialApi.chargeAssignments).mockResolvedValue([
      assignment("past-ngn", "unit-1", "NGN", "10.00", "2020-01-01"),
      assignment("past-usd", "unit-2", "USD", "5.00", "2020-01-01"),
      assignment("future-ngn", "unit-1", "NGN", "20.00", "2099-01-01"),
    ]);
  });

  it("keeps the register's currency totals separate", async () => {
    renderPage(<ResidentialFinance />);
    await screen.findAllByText("Charge future-ngn");
    const summary = screen.getByText("Open balance by currency").parentElement;
    expect(summary).toHaveTextContent(/NGN\s*30/);
    expect(summary).toHaveTextContent(/USD\s*5/);
  });

  it("shows only past-due assignments in arrears", async () => {
    renderPage(<ResidentialArrears />);
    expect(
      await screen.findByRole("heading", { name: "Arrears" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(screen.getAllByText("Charge past-ngn")[0]).toBeVisible();
      expect(screen.getAllByText("Charge past-usd")[0]).toBeVisible();
    });
    expect(screen.queryByText("Charge future-ngn")).not.toBeInTheDocument();
    const summary = screen.getByText("Open balance by currency").parentElement;
    expect(summary).toHaveTextContent(/NGN\s*10/);
    expect(summary).toHaveTextContent(/USD\s*5/);
  });
});
