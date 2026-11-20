import { describe, expect, it } from "vitest";
import {
  fromZonedDateTimeInputValue,
  toZonedDateTimeInputValue,
} from "./datetime";

describe("Site-local date and time inputs", () => {
  it("round trips an instant through the Site time zone", () => {
    const local = toZonedDateTimeInputValue(
      "2027-04-05T14:00:00Z",
      "Africa/Lagos",
    );
    expect(local).toBe("2027-04-05T15:00");
    expect(fromZonedDateTimeInputValue(local, "Africa/Lagos").toISOString()).toBe(
      "2027-04-05T14:00:00.000Z",
    );
  });

  it("rejects nonexistent and ambiguous daylight-saving times", () => {
    expect(() =>
      fromZonedDateTimeInputValue("2026-03-08T02:30", "America/New_York"),
    ).toThrow("does not exist");
    expect(() =>
      fromZonedDateTimeInputValue("2026-11-01T01:30", "America/New_York"),
    ).toThrow("occurs twice");
  });

  it("rejects invalid calendar values", () => {
    expect(() =>
      fromZonedDateTimeInputValue("2027-02-30T10:00", "Africa/Lagos"),
    ).toThrow("valid date");
  });
});
