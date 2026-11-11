import { describe, expect, it } from "vitest";

import type { VisitAuthorization } from "@/features/access-journey/api";
import { buildVisitorRows } from "./ResidentialVisitors";

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
      display_name_snapshot: "Bola Visitor",
      email_snapshot: null,
      phone_snapshot: null,
      suffix: "002",
      state: "not_checked_in",
    },
  ],
};

describe("admin visitor register", () => {
  it("renders one row per visitor rather than per invitation", () => {
    const rows = buildVisitorRows([invitation]);

    expect(rows.map((row) => row.guestName)).toEqual([
      "Ada Visitor",
      "Bola Visitor",
    ]);
    expect(rows[0].visitorId).toBe("INV-985327-001");
    expect(rows[0].status).toBe("checked_in");
    expect(rows[1].status).toBe("active");
  });

  it("searches by the visitor's individual id or bare suffix", () => {
    const rows = buildVisitorRows([invitation]);

    expect(rows[0].search_text).toContain("inv-985327-001");
    expect(rows[0].search_text).toContain("001");
    expect(rows[0].search_text).not.toContain("guest-2");
  });
});
