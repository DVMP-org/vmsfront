import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookingDetailScreen } from "./BookingDetailScreen";
import type { BookingDetailDto } from "../api-types";

const cancelMutate = vi.fn();

vi.mock("@/features/hospitality/queries", () => ({
  useHospitalityRooms: () => ({ data: [], isPending: false }),
}));

// The hooks are mocked at module scope, so the fixture has to be reachable from
// there; each test replaces it before rendering.
let current: BookingDetailDto;

vi.mock("../queries", () => ({
  useBooking: () => ({ data: current, isPending: false, isError: false }),
  useBookingPayments: () => ({
    data: [
      {
        id: "payment-1",
        booking_id: "booking-1",
        amount: "40.00",
        currency: "USD",
        status: "captured",
        method: "card",
        reference: null,
        folio_line_id: null,
        created_at: "2027-01-05T10:00:00Z",
      },
    ],
    isPending: false,
    isError: false,
  }),
  useApproveBooking: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeclineBooking: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAssignBookingRoom: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRecordBookingPayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelBooking: () => ({ mutateAsync: cancelMutate, isPending: false }),
}));

const baseBooking: BookingDetailDto = {
  id: "booking-1",
  site_id: "site-1",
  place_id: "place-1",
  kind: "booking",
  domain: "hospitality",
  host_party_id: null,
  requester_name: "Ada Visitor",
  requester_email: "ada@example.test",
  requester_phone: null,
  status: "confirmed",
  source: "phone",
  check_in_at: "2027-05-01T14:00:00Z",
  check_out_at: "2027-05-03T11:00:00Z",
  guest_count: 2,
  purpose: null,
  decline_reason: null,
  approved_at: "2027-01-01T09:00:00Z",
  approved_by: "site_admin",
  outcome: null,
  reference: "BK-1042",
  currency: "USD",
  total: "100.00",
  payment_status: null,
  created_at: "2026-12-30T09:00:00Z",
  activities: [],
  items: [
    {
      id: "item-1",
      booking_id: "booking-1",
      name: "Stay — Room 101",
      service_kind: "accommodation",
      quantity: "2",
      unit_price: "50.00",
      currency: "USD",
      total: "100.00",
      notes: null,
    },
  ],
  reservations: [],
};

function mount(overrides: Partial<BookingDetailDto> = {}) {
  current = { ...baseBooking, ...overrides };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <BookingDetailScreen bookingId="booking-1" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  cancelMutate.mockReset();
});

describe("booking detail", () => {
  it("opens on the overview and keeps the four questions apart", () => {
    mount();

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Payments" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    // The reference is the heading: it is what a guest quotes on the phone.
    expect(screen.getByRole("heading", { name: "BK-1042" })).toBeTruthy();
  });

  it("moves between tabs with the arrow keys", () => {
    mount();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Overview" }), {
      key: "ArrowRight",
    });

    expect(screen.getByRole("tab", { name: "Rooms & charges" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("reports the balance from the payments, not from a status column", () => {
    mount();
    fireEvent.click(screen.getByRole("tab", { name: "Payments" }));

    const panel = screen.getByRole("tabpanel");
    // 100 agreed, 40 captured, so 60 is still owed.
    expect(within(panel).getByText(/60/)).toBeTruthy();
  });

  it("withholds a balance when no price was ever recorded", () => {
    mount({ total: null });
    fireEvent.click(screen.getByRole("tab", { name: "Payments" }));

    // "Unknown" rather than zero: nobody agreed a price, so nothing is settled.
    expect(screen.getAllByText("Unknown").length).toBeGreaterThan(0);
  });

  it("will not cancel without a reason", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));

    const dialog = screen.getByRole("dialog");
    const confirm = within(dialog).getByRole("button", {
      name: "Cancel booking",
    });
    expect(confirm).toBeDisabled();
    expect(cancelMutate).not.toHaveBeenCalled();
  });

  it("offers no cancellation once a guest has checked in", () => {
    mount({ status: "checked_in" });

    expect(screen.queryByRole("button", { name: "Cancel booking" })).toBeNull();
  });
});
