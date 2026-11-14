import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatMoney } from "@/lib/currency";

import { PublicHospitalityBookingFlow } from "./PublicHospitalityBookingFlow";
import type { PublicSiteBooking } from "../../public-api-types";

const submitMutate = vi.fn();

const availability = {
  site_slug: "harbour-hotel",
  check_in_at: "2027-06-02T14:00:00Z",
  check_out_at: "2027-06-04T10:00:00Z",
  nights: 2,
  categories: [
    {
      id: "group-deluxe",
      name: "Deluxe Super",
      description: "King bed, city view",
      nightly_rate: "120.00",
      currency: "USD",
      capacity: 2,
      rooms_total: 3,
      rooms_available: 2,
      // Two rooms at different rates: Emerald 120, Sapphire 140.
      rates: ["120.00", "140.00", "150.00"],
      amenities: ["wifi", "air_conditioning"],
    },
    {
      id: "group-suite",
      name: "Executive Suite",
      description: null,
      nightly_rate: "260.00",
      currency: "USD",
      capacity: 3,
      rooms_total: 1,
      rooms_available: 0,
      rates: [],
      amenities: [],
    },
  ],
};

vi.mock("../../public-queries", () => ({
  usePublicAvailability: () => ({
    data: availability,
    isPending: false,
    isError: false,
    isFetching: false,
  }),
  useSubmitPublicBooking: () => ({
    mutate: submitMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
  usePayPublicBooking: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

const site: PublicSiteBooking = {
  site_id: "site-1",
  site_name: "Harbour Hotel",
  site_slug: "harbour-hotel",
  domain: "hospitality",
  timezone: "UTC",
  stage: "reservation_allowed",
  requires_host: false,
  requires_place: false,
  places: [],
  categories: availability.categories,
  hosts: [],
};

function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <PublicHospitalityBookingFlow siteSlug="harbour-hotel" site={site} />
    </QueryClientProvider>,
  );
}

async function reachDetails() {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Search rooms" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Select Deluxe Super" }),
  );
  const form = screen.getByRole("button", { name: "Continue" }).closest("form")!;
  fireEvent.change(within(form).getByLabelText("Full name"), {
    target: { value: "Ada Visitor" },
  });
  fireEvent.change(within(form).getByLabelText("Email"), {
    target: { value: "ada@example.test" },
  });
  fireEvent.click(within(form).getByRole("button", { name: "Continue" }));
}

beforeEach(() => {
  submitMutate.mockReset();
});

describe("public hospitality booking", () => {
  it("starts on the dates, not on a room list", () => {
    mount();

    expect(screen.getByLabelText("Check-in")).toBeTruthy();
    expect(screen.getByLabelText("Check-out")).toBeTruthy();
    expect(screen.queryByText("Deluxe Super")).toBeNull();
  });

  it("shows categories with what is left for those dates", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Search rooms" }));

    expect(await screen.findByText("Deluxe Super")).toBeTruthy();
    expect(screen.getByText("2 rooms left for these dates")).toBeTruthy();
    // A sold-out category is shown and disabled, not hidden: the guest should be
    // able to see the property has it, and that it is gone.
    expect(screen.getByText("No rooms of this type left for these dates")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Executive Suite is not available" }),
    ).toBeDisabled();
  });

  it("keeps the estimate visible while the guest fills in details", async () => {
    await reachDetails();

    const summary = screen.getByRole("region", { name: "Your selection" });
    expect(within(summary).getByText("Deluxe Super")).toBeTruthy();
    // The default window is one night, so the estimate is one night's rate.
    expect(within(summary).getAllByText(/120/).length).toBeGreaterThan(0);
    expect(
      within(summary).getByText(/Estimated total/),
    ).toBeTruthy();
  });

  it("books the category, not the room, and sends the room count", async () => {
    await reachDetails();
    fireEvent.click(screen.getByRole("button", { name: "Request this stay" }));

    await waitFor(() => expect(submitMutate).toHaveBeenCalledTimes(1));
    const [payload] = submitMutate.mock.calls[0];
    expect(payload).toMatchObject({
      kind: "booking",
      place_id: null,
      place_group_id: "group-deluxe",
      rooms: 1,
      guest_count: 2,
      requester_name: "Ada Visitor",
      requester_email: "ada@example.test",
    });
    // The dates the guest searched with, not the times they typed — they only
    // chose dates.
    expect(payload.check_in_at).toBeTruthy();
    expect(payload.check_out_at).toBeTruthy();
  });

  it("will not proceed without a way to reach the guest", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Search rooms" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Select Deluxe Super" }),
    );

    const form = screen.getByRole("button", { name: "Continue" }).closest("form")!;
    fireEvent.change(within(form).getByLabelText("Full name"), {
      target: { value: "Ada Visitor" },
    });

    expect(within(form).getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("prices two rooms as the two rooms the guest gets, not the cheapest twice", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Search rooms" }));

    const rooms = await screen.findByLabelText("Rooms of Deluxe Super");
    fireEvent.change(rooms, { target: { value: "2" } });

    // The free rooms are 120 and 140, so one night of two rooms is 260. Quoting
    // 120 twice would understate what the guest is about to be charged.
    const card = screen
      .getByRole("heading", { name: "Deluxe Super" })
      .closest("li") as HTMLElement;
    expect(within(card).getByText(formatMoney(260, "USD"))).toBeTruthy();
    expect(within(card).getByText(/Estimated/)).toBeTruthy();
  });
});
