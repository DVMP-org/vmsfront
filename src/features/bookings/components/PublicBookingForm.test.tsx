import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicBookingForm } from "./PublicBookingForm";
import type { PublicSiteBooking } from "../public-api-types";

const submitMutate = vi.fn();

vi.mock("../public-queries", () => ({
  usePublicSiteBooking: () => ({
    data: undefined,
    isPending: false,
    isError: false,
  }),
  useSubmitPublicBooking: () => ({
    mutate: submitMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

function host(id: string, displayName: string, placeId: string) {
  return { id, display_name: displayName, place_id: placeId };
}

function place(id: string, name: string, nightlyRate: string | null = null) {
  return {
    id,
    name,
    kind: "unit",
    building_type: null,
    nightly_rate: nightlyRate,
    currency: nightlyRate ? "USD" : null,
    capacity: 3,
    room_type: null,
  };
}

const site: PublicSiteBooking = {
  site_id: "site-1",
  site_name: "Riverside Estate",
  site_slug: "riverside",
  domain: "residential",
  timezone: "UTC",
  stage: "booking_only",
  requires_host: true,
  requires_place: true,
  places: [
    place("place-a", "Flat 12"),
    place("place-b", "Flat 14"),
    place("place-c", "Riverside Annex", "40.00"),
  ],
  categories: [],
  hosts: [
    host("party-a", "Grace Owner", "place-a"),
    host("party-b", "Sam Tenant", "place-b"),
  ],
};

function mount(overrides: Partial<PublicSiteBooking> = {}) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <PublicBookingForm
        siteSlug="riverside"
        catalogue={{ ...site, ...overrides }}
      />
    </QueryClientProvider>,
  );
}

const placeField = () =>
  screen.getByRole("combobox", { name: /Where are you going/ });
const hostField = () =>
  screen.getByRole("combobox", { name: /Who is hosting you/ });

/** Open a searchable select and pick the option with this label. */
async function choose(control: HTMLElement, label: string) {
  fireEvent.keyDown(control, { key: "ArrowDown" });
  fireEvent.click(await screen.findByText(label));
}

function fillDetails() {
  fireEvent.change(screen.getByLabelText(/Your name/), {
    target: { value: "Ada Visitor" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ada@example.test" },
  });
}

beforeEach(() => {
  submitMutate.mockReset();
});

describe("the public request form", () => {
  it("is one screen with three questions, not a funnel", () => {
    mount();

    expect(
      screen.getByRole("heading", {
        name: /Request a visit to Riverside Estate/,
      }),
    ).toBeTruthy();
    expect(placeField()).toBeTruthy();
    expect(screen.getByLabelText(/Arriving/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Send request/ })).toBeTruthy();
  });

  it("asks for dates, never for times", () => {
    mount();

    // A visitor has no opinion about whether they arrive at 15:00, so the input
    // must not ask. The times are the property's business and are applied by the
    // shared window helper.
    expect(screen.getByLabelText(/Arriving/).getAttribute("type")).toBe("date");
    expect(screen.getByLabelText(/Leaving/).getAttribute("type")).toBe("date");
  });

  it("does not ask who is hosting until it knows where", async () => {
    mount();

    // Nobody can answer "who is hosting you" before saying which home they mean.
    expect(
      screen.queryByRole("combobox", { name: /Who is hosting you/ }),
    ).toBeNull();

    await choose(placeField(), "Flat 14");

    expect(hostField()).toBeTruthy();
  });

  it("searches the places as the visitor types", async () => {
    mount();
    fireEvent.keyDown(placeField(), { key: "ArrowDown" });

    fireEvent.change(placeField(), { target: { value: "annex" } });

    expect(await screen.findByText(/Riverside Annex/)).toBeTruthy();
    expect(screen.queryByText("Flat 12")).toBeNull();
  });

  it("picks the only host for a place rather than making the visitor answer twice", async () => {
    mount();
    await choose(placeField(), "Flat 12");

    // A place with a single person who answers for it needs no second dropdown,
    // so that person is already the chosen value.
    expect(screen.getByText("Grace Owner")).toBeTruthy();
  });

  it("says so, and stops, when nobody is registered at the place", async () => {
    mount({ hosts: [host("party-b", "Sam Tenant", "place-b")] });
    await choose(placeField(), "Flat 12");
    fillDetails();

    expect(screen.getByText(/Nobody is registered at that place/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Send request/ })).toBeDisabled();
  });

  it("will not send without a way to reach the visitor", async () => {
    mount();
    await choose(placeField(), "Flat 12");
    fireEvent.change(screen.getByLabelText(/Your name/), {
      target: { value: "Ada Visitor" },
    });

    expect(
      screen.getByText(/Leave an email address or a phone number/),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Send request/ })).toBeDisabled();
  });

  it("sends a request to the chosen host for the chosen dates", async () => {
    mount();
    // Flat 14 has one person who answers for it, so choosing the place chooses
    // the host too.
    await choose(placeField(), "Flat 14");
    fillDetails();
    fireEvent.change(screen.getByLabelText(/Arriving/), {
      target: { value: "2027-06-02" },
    });
    fireEvent.change(screen.getByLabelText(/Leaving/), {
      target: { value: "2027-06-04" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send request/ }));

    await waitFor(() => expect(submitMutate).toHaveBeenCalledTimes(1));
    const [payload] = submitMutate.mock.calls[0];
    expect(payload).toMatchObject({
      kind: "booking",
      place_id: "place-b",
      host_party_id: "party-b",
      requester_name: "Ada Visitor",
      requester_email: "ada@example.test",
      guest_count: 1,
    });
    // The dates the visitor chose, at the times the property runs on.
    expect(new Date(payload.check_in_at).getHours()).toBe(15);
    expect(new Date(payload.check_out_at).getHours()).toBe(11);
  });

  it("does not pretend a request is a booking", () => {
    mount();

    expect(screen.getByText(/This is a request, not a booking/)).toBeTruthy();
    expect(screen.queryByText(/Hold a place for me/)).toBeNull();
  });
});
