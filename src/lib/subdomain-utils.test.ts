import { describe, expect, it } from "vitest";

import { buildSubdomainUrl, getSubdomain } from "@/lib/subdomain-utils";

describe("subdomain URLs", () => {
  it("builds a portless HTTPS tenant URL through the Valet proxy", () => {
    expect(buildSubdomainUrl("acme", "/workspace/harbour")).toBe(
      "https://acme.vmsfront.to/workspace/harbour",
    );
  });

  it("does not treat the base domain as a tenant", () => {
    expect(getSubdomain()).toBeNull();
  });
});
