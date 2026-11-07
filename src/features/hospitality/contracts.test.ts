import { describe, it, expect } from "vitest";
import { interval, localInput } from "./contracts";
describe("hospitality dates", () => {
  it("serializes device-local input to an explicit UTC instant", () => {
    const dates = interval("2027-04-05T15:00", "2027-04-06T11:00");
    expect(dates.planned_check_in).toBe(
      new Date("2027-04-05T15:00").toISOString(),
    );
    expect(localInput(dates.planned_check_in)).toBe("2027-04-05T15:00");
  });
  it("rejects invalid and reversed intervals before mutation", () => {
    expect(() => interval("", "")).toThrow();
    expect(() => interval("2027-01-02T10:00", "2027-01-01T10:00")).toThrow(
      "Departure",
    );
  });
});
