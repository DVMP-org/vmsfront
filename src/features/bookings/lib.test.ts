import { describe, expect, it } from "vitest";

import { bookingStatusLabel, bookingStatusTone, formatBookingWindow } from "./lib";

describe("bookingStatusTone", () => {
  it("maps approval and lifecycle states to semantic tones", () => {
    expect(bookingStatusTone("requested")).toBe("warning");
    expect(bookingStatusTone("confirmed")).toBe("info");
    expect(bookingStatusTone("checked_in")).toBe("success");
    expect(bookingStatusTone("declined")).toBe("danger");
    expect(bookingStatusTone("no_show")).toBe("danger");
    expect(bookingStatusTone("cancelled")).toBe("neutral");
  });
});

describe("bookingStatusLabel", () => {
  it("humanises snake_case statuses", () => {
    expect(bookingStatusLabel("checked_in")).toBe("Checked in");
    expect(bookingStatusLabel("no_show")).toBe("No show");
  });
});

describe("formatBookingWindow", () => {
  it("returns an em dash for unusable input", () => {
    expect(formatBookingWindow("not-a-date", "2026-01-01")).toBe("—");
    expect(formatBookingWindow("", "")).toBe("—");
  });

  it("renders a joined range for valid dates", () => {
    const value = formatBookingWindow(
      "2026-03-04T14:00:00Z",
      "2026-03-05T10:00:00Z",
    );
    expect(value).toContain("–");
  });
});
