import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RentRollSection } from "./RentRollSection";

const row = (overrides: Partial<Parameters<typeof RentRollSection>[0]["rows"][number]>) => ({
  id: "suite-1",
  space: "Suite 1",
  tenant: "Acme Studio",
  lease_ends_at: "2027-01-01T00:00:00Z",
  balance: 0,
  oldest_due: null,
  bucket: "current" as const,
  ...overrides,
});

describe("commercial rent roll section", () => {
  it("shows tenants, balances and arrears age", () => {
    render(
      <RentRollSection
        rows={[
          row({ balance: 750, oldest_due: "2026-08-01", bucket: "90_plus" }),
          row({
            id: "suite-2",
            space: "Suite 2",
            tenant: null,
            lease_ends_at: null,
            balance: 300,
            bucket: "1_30",
          }),
        ]}
        currency="NGN"
        isLoading={false}
        errorMessage={null}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Rent roll & arrears ageing")).toBeInTheDocument();
    expect(screen.getAllByText("Suite 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Acme Studio").length).toBeGreaterThan(0);
    expect(screen.getAllByText("90+ days").length).toBeGreaterThan(0);
    // A vacant space keeps its arrears on the roll.
    expect(screen.getAllByText(/Vacant — arrears only/).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("list", { name: "Outstanding money by arrears age" }))
      .toBeInTheDocument();
  });
});
