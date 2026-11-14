import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LeaseAgreement } from "./api";
import { AgreementCard } from "./AgreementCard";

const mocks = vi.hoisted(() => ({
  agreements: vi.fn(),
  accept: vi.fn(),
}));

vi.mock("./queries", () => ({
  useLeaseAgreements: mocks.agreements,
  useAcceptLease: () => ({
    mutate: mocks.accept,
    isPending: false,
  }),
}));

function lease(overrides: Partial<LeaseAgreement> = {}): LeaseAgreement {
  return {
    id: "lease-1",
    reference: "LSE-2026-014",
    kind: "lease",
    status: "active",
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: "2027-01-01T00:00:00Z",
    rent_amount: "500000.00",
    currency: "NGN",
    rent_cadence: "monthly",
    deposit_amount: null,
    notice_days: 30,
    signed_at: "2025-12-20T00:00:00Z",
    accepted_at: null,
    charge_lines: [
      {
        id: "line-1",
        name: "Rent",
        amount: "500000.00",
        currency: "NGN",
        recurrence: "monthly",
        status: "applied",
      },
    ],
    ...overrides,
  };
}

function withLeases(items: LeaseAgreement[]) {
  mocks.agreements.mockReturnValue({
    data: { items, total: items.length },
    isError: false,
  });
}

describe("agreement card", () => {
  it("offers acceptance for a confirmed lease the tenant has not acknowledged", () => {
    withLeases([lease()]);
    render(<AgreementCard placeId="place" partyId="party" />);

    expect(screen.getByText("Your agreement")).toBeInTheDocument();
    expect(screen.getByText("LSE-2026-014")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Accept terms" }),
    ).toBeInTheDocument();
  });

  it("replaces the action with the acceptance date once acknowledged", () => {
    withLeases([lease({ accepted_at: "2026-01-05T09:00:00Z" })]);
    render(<AgreementCard placeId="place" partyId="party" />);

    expect(
      screen.getByText(/You accepted these terms on/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Accept terms" }),
    ).not.toBeInTheDocument();
  });

  it("does not offer acceptance before an administrator confirms the lease", () => {
    withLeases([lease({ status: "draft", signed_at: null })]);
    render(<AgreementCard placeId="place" partyId="party" />);

    expect(
      screen.queryByRole("button", { name: "Accept terms" }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when the tenant has no agreement here", () => {
    withLeases([]);
    const { container } = render(
      <AgreementCard placeId="place" partyId="party" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
