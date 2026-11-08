import { render, screen } from "@testing-library/react";
import { vi, describe, expect, it, beforeEach } from "vitest";
import TransactionsPage from "./page";

const mocks = vi.hoisted(() => ({
  transactions: vi.fn(),
  router: { push: vi.fn() },
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminTransactions: mocks.transactions,
}));

vi.mock("@/hooks/use-url-query-sync", () => ({
  useUrlQuerySync: () => ({
    initializeFromUrl: (key: string) => {
      const defaults: Record<string, string | number | undefined> = {
        page: 1,
        pageSize: 20,
        search: "",
      };
      return defaults[key];
    },
    syncToUrl: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transactions.mockReturnValue({
    data: {
      items: [
        {
          id: "transaction-1",
          reference: "TRX-2026-001",
          type: "charge",
          status: "success",
          amount: 25000,
          currency: "NGN",
          processor: "paystack",
          created_at: "2026-11-08T10:00:00Z",
          paid_at: "2026-11-08T10:01:00Z",
        },
      ],
      total: 1,
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe("transaction register", () => {
  it("renders a full-page register with exact payment records", () => {
    render(<TransactionsPage />);

    expect(
      screen.getByRole("heading", { name: "Transactions" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("TRX-2026-001").length).toBeGreaterThan(0);
    expect(screen.getByText("1 records")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /View/ }).length,
    ).toBeGreaterThan(0);
  });

  it("shows a retryable ledger failure", () => {
    const refetch = vi.fn();
    mocks.transactions.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error("ledger unavailable"),
      refetch,
    });
    render(<TransactionsPage />);

    expect(
      screen.getByText("Transactions are unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("ledger unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
