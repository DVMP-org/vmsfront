import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MyCharges } from "./MyCharges";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  pay: vi.fn(),
  assign: vi.fn(),
}));

vi.mock("./api", () => ({ myChargesApi: mocks }));

const charge = {
  id: "schedule",
  target_place_id: "unit",
  due_date: "2026-12-10T00:00:00Z",
  amount: "25000.00",
  amount_paid: "0.00",
  balance: "25000.00",
  currency: "NGN",
  status: "scheduled" as const,
  charge_definition: {
    id: "definition",
    name: "Monthly service charge",
    description: null,
    recurrence: "monthly",
  },
  target_place: {
    id: "unit",
    name: "Apartment 4B",
    kind: "unit",
  },
};

function mount() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MyCharges placeId="unit" placeName="Apartment 4B" />
    </QueryClientProvider>,
  );
}

describe("personal charges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: mocks.assign },
    });
    mocks.list.mockResolvedValue([
      charge,
      {
        ...charge,
        id: "other",
        target_place_id: "other-unit",
        target_place: { id: "other-unit", name: "Other unit", kind: "unit" },
      },
    ]);
  });

  it("shows only balances for the selected property", async () => {
    mount();

    expect(
      await screen.findByRole("heading", {
        name: "Charges for Apartment 4B",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Monthly service charge")).toBeInTheDocument();
    expect(screen.getAllByText("NGN 25,000.00")).toHaveLength(2);
    expect(screen.queryByText("Other unit")).toBeNull();
  });

  it("initializes checkout for the responsible Party", async () => {
    mocks.pay.mockResolvedValue({
      access_code: "access",
      reference: "reference",
      authorization_url: "https://checkout.example.test",
      status: "pending",
    });
    mount();

    fireEvent.click(
      await screen.findByRole("button", { name: /Pay balance/ }),
    );

    await waitFor(() => expect(mocks.pay).toHaveBeenCalledWith("schedule"));
    await waitFor(() =>
      expect(mocks.assign).toHaveBeenCalledWith(
        "https://checkout.example.test",
      ),
    );
  });

  it("shows an explicit empty state", async () => {
    mocks.list.mockResolvedValue([]);
    mount();

    expect(await screen.findByText("No charges due")).toBeInTheDocument();
  });
});
