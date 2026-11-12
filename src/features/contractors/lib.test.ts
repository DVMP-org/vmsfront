import { describe, expect, it } from "vitest";

import type { Contractor } from "./api";
import {
  contractorNeedsAttention,
  contractorPermitState,
  contractorStatusTone,
  contractorWindow,
} from "./lib";

const DAY = 86_400_000;

function contractor(overrides: Partial<Contractor> = {}): Contractor {
  const now = Date.now();
  return {
    id: "contractor-1",
    organization_id: "org",
    site_id: "site",
    contact_name: "Ada Field",
    company_name: "Field Facilities",
    email: "ada@vendor.example",
    phone: null,
    purpose: "HVAC service",
    status: "active",
    requires_permit: false,
    permit_reference: null,
    permit_expires_at: null,
    access_from: new Date(now - DAY).toISOString(),
    access_to: new Date(now + 30 * DAY).toISOString(),
    notes: null,
    invited_at: new Date(now - DAY).toISOString(),
    revoked_at: null,
    created_at: new Date(now - DAY).toISOString(),
    updated_at: new Date(now - DAY).toISOString(),
    ...overrides,
  };
}

describe("contractor helpers", () => {
  it("maps statuses to readable tones", () => {
    expect(contractorStatusTone("active")).toBe("success");
    expect(contractorStatusTone("invited")).toBe("warning");
    expect(contractorStatusTone("revoked")).toBe("danger");
    expect(contractorStatusTone("expired")).toBe("neutral");
  });

  it("reports the permit state of a contractor", () => {
    expect(contractorPermitState(contractor())).toBe("not_required");

    const missing = contractor({ requires_permit: true });
    expect(contractorPermitState(missing)).toBe("missing");

    const expired = contractor({
      requires_permit: true,
      permit_reference: "PRM-1",
      permit_expires_at: new Date(Date.now() - DAY).toISOString(),
    });
    expect(contractorPermitState(expired)).toBe("expired");

    const valid = contractor({
      requires_permit: true,
      permit_reference: "PRM-1",
      permit_expires_at: new Date(Date.now() + 10 * DAY).toISOString(),
    });
    expect(contractorPermitState(valid)).toBe("valid");
  });

  it("flags windows ending inside a week and unhealthy permits", () => {
    expect(contractorNeedsAttention(contractor())).toBe(false);
    expect(
      contractorNeedsAttention(
        contractor({ access_to: new Date(Date.now() + 2 * DAY).toISOString() }),
      ),
    ).toBe(true);
    expect(
      contractorNeedsAttention(
        contractor({
          requires_permit: true,
          permit_reference: "PRM-1",
          permit_expires_at: new Date(Date.now() - DAY).toISOString(),
        }),
      ),
    ).toBe(true);
  });

  it("collapses a same-day window", () => {
    const sameDay = contractor({
      access_from: "2026-11-20T08:00:00.000Z",
      access_to: "2026-11-20T18:00:00.000Z",
    });
    expect(contractorWindow(sameDay)).not.toContain("–");
  });
});
