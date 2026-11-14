import { describe, expect, it } from "vitest";

import type { VisitAuthorization } from "@/features/access-journey/api";

import {
  buildVisitorRows,
  visitorStatusLabel,
  visitorStatusVariant,
} from "./lib";

const invitation: VisitAuthorization = {
  id: "invite",
  host_party_id: "host",
  destination_place_id: "unit",
  code: "INV-985327",
  qr_code_url: null,
  status: "approved",
  display_status: "active",
  valid_from: "2026-11-07T10:00:00.000Z",
  valid_to: "2026-11-07T16:00:00.000Z",
  max_uses: 1,
  uses_count: 1,
  purpose: "Family visit",
  additional_information: null,
  decline_reason: null,
  requested_at: "2026-11-07T08:00:00.000Z",
  decided_at: null,
  host_party: { display_name: "Alex Morgan" },
  destination_place: {
    id: "unit",
    name: "Apartment A-101",
    kind: "unit",
    address: "1 Harbour Way",
  },
  guests: [
    {
      id: "guest-1",
      display_name_snapshot: "Ada Visitor",
      email_snapshot: null,
      phone_snapshot: null,
      suffix: "001",
      state: "checked_in",
    },
    {
      id: "guest-2",
      display_name_snapshot: "Ben Visitor",
      email_snapshot: "ben@visitor.test",
      phone_snapshot: null,
      suffix: "002",
      state: "expected",
    },
  ],
} as VisitAuthorization;

describe("visitor register rows", () => {
  it("produces one row per guest, not per invitation", () => {
    const rows = buildVisitorRows([invitation]);

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.guestName)).toEqual([
      "Ada Visitor",
      "Ben Visitor",
    ]);
    expect(rows[1].visitorId).toBe("INV-985327-002");
  });

  it("lets an arrived guest outrank the invitation's own status", () => {
    const [arrived, expected] = buildVisitorRows([invitation]);

    expect(arrived.status).toBe("checked_in");
    expect(expected.status).toBe("active");
  });

  it("searches across the guest, the invitation code and the host", () => {
    const [arrived] = buildVisitorRows([invitation]);

    expect(arrived.search_text).toContain("ada visitor");
    expect(arrived.search_text).toContain("inv-985327");
    expect(arrived.search_text).toContain("alex morgan");
    expect(arrived.search_text).toContain("apartment a-101");
  });

  it("turns machine states into the words the office uses", () => {
    expect(visitorStatusLabel({ status: "requested" })).toBe(
      "Awaiting approval",
    );
    expect(visitorStatusLabel({ status: "approved" })).toBe("Expected");
    expect(visitorStatusVariant("expired")).toBe("danger");
    expect(visitorStatusVariant("checked_in")).toBe("info");
  });
});
