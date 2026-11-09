import { describe, expect, it } from "vitest";

import { contextualAdminLinks } from "./admin-routes";

describe("residential administration routing", () => {
  it("shows the specialist module only when the effective property context enables it", () => {
    const enabled = contextualAdminLinks(["residential"], [
      {
        key: "residential",
        label: "Residential operations",
        modules: ["residential"],
      },
    ]);
    expect(enabled.map((link) => link.href)).toContain("/admin/residential");

    const disabled = contextualAdminLinks(["commercial"], [
      {
        key: "commercial",
        label: "Commercial operations",
        modules: ["commercial"],
      },
    ]);
    expect(disabled.map((link) => link.href)).not.toContain(
      "/admin/residential",
    );
  });
});
