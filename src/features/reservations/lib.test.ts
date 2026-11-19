import { describe, expect, it } from "vitest";

import {
  holdsReason,
  itemQuantityLabel,
  reservationResourceLabel,
  reservationStatusLabel,
  reservationStatusTone,
  reservationWindow,
} from "./lib";
import type { ReservationDto } from "./api-types";

function reservation(overrides: Partial<ReservationDto> = {}): ReservationDto {
  return {
    id: "r1",
    site_id: "s1",
    booking_id: "b1",
    booking_item_id: "i1",
    place_id: null,
    place_type: null,
    start_at: "2027-03-01T15:00:00Z",
    end_at: "2027-03-04T11:00:00Z",
    status: "held",
    expires_at: "2027-03-01T18:00:00Z",
    notes: null,
    is_holding: true,
    ...overrides,
  };
}

describe("reservation status", () => {
  it("gives a held reservation the attention colour", () => {
    expect(reservationStatusTone("held")).toBe("warning");
  });

  it("does not let a lapsed or released row read as current", () => {
    expect(reservationStatusTone("expired")).toBe("neutral");
    expect(reservationStatusTone("cancelled")).toBe("neutral");
    expect(reservationStatusTone("completed")).toBe("neutral");
  });

  it("labels each state in words a desk uses", () => {
    expect(reservationStatusLabel("held")).toBe("Held");
    expect(reservationStatusLabel("confirmed")).toBe("Confirmed");
  });
});

describe("reservationResourceLabel", () => {
  it("names the room when one is assigned", () => {
    expect(reservationResourceLabel({ place_type: "deluxe" }, "Room 101")).toBe(
      "Room 101",
    );
  });

  it("says which category is held, and that it still needs a room", () => {
    // "Unassigned" would hide the thing the desk has to act on.
    expect(reservationResourceLabel({ place_type: "deluxe" })).toBe(
      "deluxe (no room yet)",
    );
  });

  it("refuses to invent a resource when there is none", () => {
    expect(reservationResourceLabel({ place_type: null })).toBe("No resource");
  });
});

describe("holdsReason", () => {
  it("is silent while the row is genuinely holding", () => {
    expect(holdsReason(reservation())).toBeNull();
  });

  it("explains a held row that has stopped blocking", () => {
    // The case the whole server-side `is_holding` flag exists for.
    expect(
      holdsReason(reservation({ status: "held", is_holding: false })),
    ).toBe("Hold lapsed");
  });

  it("distinguishes the ways a row can stop holding", () => {
    expect(
      holdsReason(reservation({ status: "cancelled", is_holding: false })),
    ).toBe("Released");
    expect(
      holdsReason(reservation({ status: "expired", is_holding: false })),
    ).toBe("Expired");
    expect(
      holdsReason(reservation({ status: "completed", is_holding: false })),
    ).toBe("Stayed");
  });
});

describe("reservationWindow", () => {
  it("shows both ends of the period", () => {
    expect(reservationWindow(reservation())).toContain("→");
  });
});

describe("itemQuantityLabel", () => {
  it("counts nights for accommodation", () => {
    expect(itemQuantityLabel("2", "accommodation")).toBe("2 nights");
    expect(itemQuantityLabel("1", "accommodation")).toBe("1 night");
  });

  it("counts units for anything else", () => {
    expect(itemQuantityLabel("3", "service")).toBe("3 units");
    expect(itemQuantityLabel("1", "event_space")).toBe("1 unit");
  });
});
