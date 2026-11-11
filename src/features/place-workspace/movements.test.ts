import { describe, expect, it } from "vitest";

import type { Movement } from "./api";
import { buildVisitorJourneys } from "./MovementsSection";

function movement(overrides: Partial<Movement>): Movement {
  return {
    id: "event",
    gate_name: "Main Gate",
    direction: "entry",
    outcome: "allowed",
    reason_code: "valid_authorization",
    subject_type: "visitor",
    occurred_at: "2026-11-07T10:00:00.000Z",
    ...overrides,
  };
}

const options = { audience: "my_visitors" as const, range: "all" as const };

describe("movement log journeys", () => {
  it("collapses every scan owned by a visitor into one row", () => {
    const rows = buildVisitorJourneys(
      [
        movement({
          id: "scan-1",
          subject_key: "guest-1",
          person_name: "Ada Visitor",
          invitation_code: "INV-985327",
          guest_suffix: "001",
          occurred_at: "2026-11-07T10:00:00.000Z",
        }),
        movement({
          id: "scan-2",
          subject_key: "guest-1",
          person_name: "Ada Visitor",
          invitation_code: "INV-985327",
          guest_suffix: "001",
          gate_name: "Gate 2",
          occurred_at: "2026-11-07T11:00:00.000Z",
        }),
      ],
      { ...options, needle: "" },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].movements).toHaveLength(2);
    expect(rows[0].gatePath).toEqual(["Main Gate", "Gate 2"]);
    expect(rows[0].credentialReference).toBe("INV-985327-001");
  });

  it("searches a visitor by invitation id or bare suffix", () => {
    const items = [
      movement({
        id: "scan-1",
        subject_key: "guest-1",
        person_name: "Ada Visitor",
        invitation_code: "INV-985327",
        guest_suffix: "001",
      }),
      movement({
        id: "scan-2",
        subject_key: "guest-2",
        person_name: "Bola Visitor",
        invitation_code: "INV-985327",
        guest_suffix: "002",
      }),
    ];

    const byId = buildVisitorJourneys(items, {
      ...options,
      needle: "inv-985327-002",
    });
    expect(byId.map((row) => row.personName)).toEqual(["Bola Visitor"]);

    const bySuffix = buildVisitorJourneys(items, {
      ...options,
      needle: "001",
    });
    expect(bySuffix.map((row) => row.personName)).toEqual(["Ada Visitor"]);
  });
});
