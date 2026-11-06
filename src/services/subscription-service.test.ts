import { describe, expect, it } from "vitest";

import { isDirectSubscriptionResponse } from "@/services/subscription-service";

describe("subscription response contracts", () => {
  it("recognizes a direct free-plan subscription", () => {
    expect(
      isDirectSubscriptionResponse({
        id: "subscription-1",
        organization_id: "organization-1",
        plan_id: "free-plan",
        status: "active" as never,
        created_at: "2026-11-06T00:00:00Z",
        updated_at: "2026-11-06T00:00:00Z",
        plan: null,
      }),
    ).toBe(true);
  });

  it("recognizes a paid-plan checkout response", () => {
    expect(
      isDirectSubscriptionResponse({
        authorization_url: "https://checkout.paystack.com/test",
        reference: "reference-1",
      }),
    ).toBe(false);
  });
});
