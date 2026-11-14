import { describe, expect, it } from "vitest";

import {
  bookingStatusLabel,
  bookingStatusTone,
  filterValue,
  formatBookingWindow,
  publicBookingUrl,
  toBookingSummary,
} from "./lib";

describe("filterValue", () => {
  it("reads the table's filter list into one query value", () => {
    const filters = [
      { field: "kind", operator: "eq" as const, value: "reservation" },
      { field: "status", operator: "eq" as const, value: "requested" },
    ];

    expect(filterValue(filters, "kind")).toBe("reservation");
    expect(filterValue(filters, "status")).toBe("requested");
  });

  it("reports nothing for a filter that is not set", () => {
    expect(filterValue([], "kind")).toBeUndefined();
  });

  it("treats an empty value as no filter, not as a filter for nothing", () => {
    expect(
      filterValue([{ field: "kind", value: "" }], "kind"),
    ).toBeUndefined();
  });

  it("uses the first entry when the table sends a list", () => {
    expect(
      filterValue([{ field: "kind", value: ["booking", "reservation"] }], "kind"),
    ).toBe("booking");
  });
});

describe("publicBookingUrl", () => {
  it("addresses the Site's own booking page on the current origin", () => {
    expect(publicBookingUrl("harbour-hotel", "https://acme.vms.app")).toBe(
      "https://acme.vms.app/book/harbour-hotel",
    );
  });

  it("does not double the slash when the origin has a trailing one", () => {
    expect(publicBookingUrl("harbour-hotel", "https://acme.vms.app/")).toBe(
      "https://acme.vms.app/book/harbour-hotel",
    );
  });

  it("has no link without a slug, rather than a broken one", () => {
    expect(publicBookingUrl(null, "https://acme.vms.app")).toBeNull();
    expect(publicBookingUrl("   ", "https://acme.vms.app")).toBeNull();
  });
});

describe("bookingStatusTone", () => {
  it("maps approval and lifecycle states to semantic tones", () => {
    expect(bookingStatusTone("requested")).toBe("warning");
    expect(bookingStatusTone("confirmed")).toBe("info");
    expect(bookingStatusTone("checked_in")).toBe("success");
    expect(bookingStatusTone("declined")).toBe("danger");
    expect(bookingStatusTone("no_show")).toBe("danger");
    expect(bookingStatusTone("cancelled")).toBe("neutral");
  });

  it("does not let an unpaid booking read as neutral history", () => {
    expect(bookingStatusTone("pending_payment")).toBe("warning");
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

describe("toBookingSummary", () => {
  it("says a reservation has no place yet rather than showing a blank cell", () => {
    const summary = toBookingSummary({
      id: "b1",
      site_id: "s1",
      place_id: null,
      kind: "reservation",
      domain: "hospitality",
      host_party_id: null,
      requester_name: "Ada Visitor",
      requester_email: "ada@example.test",
      requester_phone: null,
      status: "requested",
      check_in_at: "2026-03-04T14:00:00Z",
      check_out_at: "2026-03-05T10:00:00Z",
      guest_count: 2,
      purpose: null,
      decline_reason: null,
      approved_at: null,
      approved_by: null,
      outcome: null,
      created_at: "2026-03-01T09:00:00Z",
    });

    expect(summary.placeName).toBe("No place yet");
    expect(summary.requester.email).toBe("ada@example.test");
    expect(summary.guestCount).toBe(2);
  });
});
