import { describe, expect, it } from "vitest";

import {
  canBookCategory,
  defaultStayDates,
  estimateFromRates,
  nightsBetween,
  stayWindow,
} from "./public-lib";

describe("public booking dates", () => {
  it("counts a 15:00 arrival and an 11:00 departure as one night", () => {
    // Subtracting the instants would say zero, which is how a one-night stay
    // becomes a free one.
    const { checkInAt, checkOutAt } = stayWindow("2027-06-01", "2027-06-02");
    expect(nightsBetween("2027-06-01", "2027-06-02")).toBe(1);
    expect(checkInAt).toBeTruthy();
    expect(checkOutAt).toBeTruthy();
  });

  it("applies the property's own arrival and departure times", () => {
    const { checkInAt, checkOutAt } = stayWindow("2027-06-01", "2027-06-03");

    expect(new Date(checkInAt as string).getHours()).toBe(15);
    expect(new Date(checkOutAt as string).getHours()).toBe(11);
  });

  it("returns nulls for a half-filled window rather than inventing one", () => {
    expect(stayWindow("", "2027-06-03")).toEqual({
      checkInAt: null,
      checkOutAt: null,
    });
  });

  it("refuses a backwards or same-day window", () => {
    expect(nightsBetween("2027-06-03", "2027-06-01")).toBe(0);
    expect(nightsBetween("2027-06-03", "2027-06-03")).toBe(0);
  });

  it("defaults to tomorrow for one night", () => {
    const { checkIn, checkOut } = defaultStayDates(new Date("2027-06-01T10:00:00"));
    expect(nightsBetween(checkIn, checkOut)).toBe(1);
  });
});

describe("public booking pricing", () => {
  it("adds up the rooms the guest is actually taking", () => {
    // Emerald 50,000 and Sapphire 60,000 are both "Deluxe Super". Two rooms for
    // one night is 110,000 — not the cheapest room twice.
    expect(estimateFromRates(["50000", "60000", "70000"], 1, 2)).toBe(110000);
    expect(estimateFromRates(["50000", "60000", "70000"], 1, 1)).toBe(50000);
    expect(estimateFromRates(["50000", "60000"], 3, 2)).toBe(330000);
  });

  it("has no estimate when there are not enough rooms to fill the request", () => {
    // Quoting a total for rooms that do not exist would be inventing one.
    expect(estimateFromRates(["50000"], 1, 2)).toBeNull();
    expect(estimateFromRates([], 1, 1)).toBeNull();
  });

  it("will not present an unpriced category as bookable", () => {
    // Zero is a price; absence is not. A category with no rate cannot be sold.
    expect(canBookCategory({ rooms_available: 2, nightly_rate: null })).toBe(false);
    expect(canBookCategory({ rooms_available: 0, nightly_rate: "120.00" })).toBe(false);
    expect(canBookCategory({ rooms_available: 1, nightly_rate: "120.00" })).toBe(true);
  });
});
