import { describe, expect, it } from "vitest";

import { buildSubdomainUrl, getSubdomain } from "@/lib/subdomain-utils";

describe("subdomain URLs", () => {
  it("builds a portless HTTPS tenant URL through the Valet proxy", () => {
    expect(buildSubdomainUrl("acme", "/select")).toBe(
      "https://acme.vmsfront.to/select",
    );
  });

  it("does not treat the base domain as a tenant", () => {
    expect(getSubdomain()).toBeNull();
  });
});
