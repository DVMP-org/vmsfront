import { describe, expect, it } from "vitest";

import { contextualAdminLinks } from "./admin-routes";

describe("residential administration routing", () => {
  it("shows the specialist module only when the effective property context enables it", () => {
    const enabled = contextualAdminLinks(
      ["residential"],
      [
        {
          key: "residential",
          label: "Residential operations",
          modules: ["residential"],
        },
      ],
      "residential",
    );
    expect(enabled.map((link) => link.href)).toContain("/admin/residential");

    const disabled = contextualAdminLinks(
      ["commercial"],
      [
        {
          key: "commercial",
          label: "Commercial operations",
          modules: ["commercial"],
        },
      ],
      "commercial",
    );
    expect(disabled.map((link) => link.href)).not.toContain(
      "/admin/residential",
    );
  });

  it("shows mixed-use facilities and expense allocation only when enabled", () => {
    const links = contextualAdminLinks(
      ["shared_facilities", "expense_allocation"],
      [],
      "mixed_use",
    );
    expect(links.map((link) => link.href)).toEqual(
      expect.arrayContaining([
        "/admin/mixed-use/facilities",
        "/admin/mixed-use/expenses",
      ]),
    );

    const disabled = contextualAdminLinks(
      ["residential", "commercial"],
      [],
      "residential",
    );
    expect(disabled.map((link) => link.href)).not.toContain(
      "/admin/mixed-use/facilities",
    );
  });

  it("uses domain-specific unit and resident routes instead of generic property and people links", () => {
    const links = contextualAdminLinks(
      ["residential", "properties", "people", "maintenance"],
      [],
      "residential",
    );
    const hrefs = links.map((link) => link.href);
    expect(hrefs).toContain("/admin/residential/units");
    expect(hrefs).toContain("/admin/residential/occupancies");
    expect(hrefs).not.toContain("/admin/properties");
    expect(hrefs).not.toContain("/admin/people");
  });
});
