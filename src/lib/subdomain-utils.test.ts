import { describe, expect, it } from "vitest";

import { buildSubdomainUrl, getSubdomain } from "@/lib/subdomain-utils";

describe("subdomain URLs", () => {
  it("preserves the local HTTP port when navigating to a tenant", () => {
    expect(buildSubdomainUrl("acme", "/select")).toBe(
      "http://acme.vmsfront.to:3000/select",
    );
  });

  it("does not treat the base domain as a tenant", () => {
    expect(getSubdomain()).toBeNull();
  });
});
