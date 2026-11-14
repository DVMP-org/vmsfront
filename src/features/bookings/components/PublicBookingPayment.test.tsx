import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";

import { formatMoney } from "@/lib/currency";
import { PublicBookingPayment } from "./PublicBookingPayment";
import type { PublicBookingCreated } from "../public-api-types";

vi.mock("../public-queries", () => ({
  usePayPublicBooking: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

function mount(booking: PublicBookingCreated) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PublicBookingPayment siteSlug="harbour-hotel" booking={booking} />
    </QueryClientProvider>,
  );
}

const priced: PublicBookingCreated = {
  id: "booking-1",
  status: "requested",
  kind: "booking",
  site_name: "Harbour Hotel",
  place_name: "Harbour Room 1",
  check_in_at: "2027-05-01T14:00:00Z",
  check_out_at: "2027-05-03T11:00:00Z",
  guest_count: 2,
  nights: 2,
  nightly_rate: "50.00",
  currency: "USD",
  amount_due: "100.00",
  payable: true,
};

it("offers the server's price, not one the page worked out", () => {
  mount(priced);

  // Asserted through the shared formatter rather than a hard-coded "$100.00":
  // how money is rendered is decided in one place, and that includes dropping
  // the decimals on a whole amount.
  const total = formatMoney("100.00", "USD");
  const rate = formatMoney("50.00", "USD");

  // Exact strings, not regexes: "$100" in a regex is an end-of-string anchor.
  expect(screen.getByRole("button", { name: `Pay ${total}` })).toBeTruthy();
  expect(
    screen.getByText(`2 nights at ${rate} a night`),
  ).toBeTruthy();
});

it("offers no payment when the stay has nothing to charge", () => {
  // A reservation holding no room has no rate yet, so `payable` is false and
  // there is nothing honest to ask for.
  const { container } = mount({
    ...priced,
    place_name: null,
    nights: null,
    nightly_rate: null,
    amount_due: null,
    payable: false,
  });

  expect(container.querySelector("button")).toBeNull();
});

it("says that paying does not confirm the stay", () => {
  mount(priced);

  // The promise a guest would otherwise assume — that money means a confirmed
  // room — is the one thing this must never imply.
  expect(
    screen.getByText(/paying does not confirm the stay/i),
  ).toBeTruthy();
});
