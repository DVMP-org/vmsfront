import { describe, expect, it } from "vitest";

import { contextualAdminLinks, isModuleEnabled } from "./admin-routes";

describe("residential administration routing", () => {
  it("keeps shared Access links under one contiguous section", () => {
    const links = contextualAdminLinks(
      ["properties", "people", "access_control", "billing", "forum"],
      [],
    );
    const groups = links.map((link) => link.group);
    expect(groups.filter((group) => group === "Access")).toHaveLength(3);
    expect(
      groups.slice(groups.indexOf("Access"), groups.lastIndexOf("Access") + 1),
    ).toEqual(["Access", "Access", "Access"]);
  });

  it("keeps Overview available in every Site domain independently of optional modules", () => {
    for (const useCase of [
      "residential",
      "commercial",
      "hospitality",
      "mixed_use",
    ]) {
      const overview = contextualAdminLinks([], [], useCase).find(
        (link) => link.href === "/admin",
      );
      expect(overview).toMatchObject({ label: "Overview" });
      expect(overview?.module).toBeUndefined();
    }

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
    expect(enabled.map((link) => link.href)).toContain("/admin");
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
  it("shows residential access links when access control is enabled", () => {
    const enabled = contextualAdminLinks(["access_control"], [], "residential");
    expect(enabled.map((link) => link.href)).toEqual(
      expect.arrayContaining([
        "/admin/gates",
        "/admin/checkpoints/console",
        "/admin/invitations",
        "/admin/passages",
      ]),
    );
    expect(
      contextualAdminLinks(["residential"], [], "residential").map(
        (link) => link.href,
      ),
    ).not.toContain("/admin/gates");
  });
  it("exposes leases in the residential sidebar only when the leases module is enabled", () => {
    const enabled = contextualAdminLinks(
      ["residential", "leases", "billing"],
      [],
      "residential",
    );
    const lease = enabled.find(
      (link) => link.href === "/admin/residential/leases",
    );
    expect(lease).toMatchObject({
      label: "Leases & agreements",
      group: "Finance",
      module: "leases",
    });

    expect(
      contextualAdminLinks(["residential", "billing"], [], "residential").map(
        (link) => link.href,
      ),
    ).not.toContain("/admin/residential/leases");
  });

  it("filters Finance and Access using canonical Site module keys", () => {
    const links = contextualAdminLinks(
      ["residential", "billing", "access_control", "communication", "forum"],
      [],
      "residential",
    );
    const hrefs = links.map((link) => link.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/admin/charges",
        "/admin/gates",
        "/admin/invitations",
        "/admin/passages",
      ]),
    );
    const finance = links.filter((link) => link.group === "Finance");
    expect(finance.map((link) => link.href)).toEqual(
      expect.arrayContaining([
        "/admin/charges",
        "/admin/charges/schedules",
        "/admin/residential/finance",
        "/admin/residential/arrears",
      ]),
    );
    expect(finance.every((link) => !link.children)).toBe(true);
    expect(isModuleEnabled("billing", ["billing"])).toBe(true);
    expect(isModuleEnabled("billing", ["residential"])).toBe(false);
    expect(isModuleEnabled("charges", ["billing"])).toBe(false);
    expect(isModuleEnabled(undefined, [])).toBe(true);
  });

  it("shows Mixed-use Overview, Finance and Access for canonical modules", () => {
    const links = contextualAdminLinks(
      ["properties", "billing", "access_control"],
      [],
      "mixed_use",
    );
    const hrefs = links.map((link) => link.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/admin",
        "/admin/places",
        "/admin/charges",
        "/admin/gates",
        "/admin/checkpoints/console",
        "/admin/invitations",
        "/admin/passages",
      ]),
    );
  });

  it("keeps commercial Finance destinations separate and visible", () => {
    const finance = contextualAdminLinks(
      ["commercial", "billing"],
      [],
      "commercial",
    ).filter((link) => link.group === "Finance");
    expect(finance.map((link) => link.href)).toEqual([
      "/admin/charges",
      "/admin/charges/schedules",
      "/admin/commercial/charges",
      "/admin/commercial/finance",
    ]);
    expect(finance.every((link) => !link.children)).toBe(true);
  });
});
