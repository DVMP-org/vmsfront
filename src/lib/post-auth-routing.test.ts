import { describe, expect, it } from "vitest";

import { resolvePostAuthDestination } from "@/lib/post-auth-routing";
import type { Organization } from "@/types";
import { SubscriptionStatus, type Subscription } from "@/types/subscription";

function organization(
  slug: string,
  status: SubscriptionStatus | null,
): Organization {
  return {
    id: `org-${slug}`,
    name: slug,
    slug,
    created_at: "2026-11-06T00:00:00Z",
    updated_at: "2026-11-06T00:00:00Z",
    subscription: status
      ? ({
          id: `subscription-${slug}`,
          organization_id: `org-${slug}`,
          plan_id: "free-plan",
          status,
          created_at: "2026-11-06T00:00:00Z",
          updated_at: "2026-11-06T00:00:00Z",
          plan: null,
        } satisfies Subscription)
      : null,
  };
}

describe("post-auth destination", () => {
  it("opens the only organization with active access", () => {
    expect(
      resolvePostAuthDestination([
        organization("acme", SubscriptionStatus.ACTIVE),
      ]),
    ).toBe("https://acme.vmsfront.to/select");
  });

  it("opens plan selection when the only organization has no access", () => {
    expect(resolvePostAuthDestination([organization("acme", null)])).toBe(
      "https://acme.vmsfront.to/plans",
    );
  });

  it("keeps the organization list for ambiguous or empty memberships", () => {
    expect(resolvePostAuthDestination([])).toBe("/organizations");
    expect(
      resolvePostAuthDestination([
        organization("first", SubscriptionStatus.ACTIVE),
        organization("second", SubscriptionStatus.ACTIVE),
      ]),
    ).toBe("/organizations");
  });
});
