import { describe, expect, it } from "vitest";

import { contextualAdminLinks, isModuleEnabled } from "./admin-routes";

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
    expect(enabled.map((link) => link.href)).toContain("/admin");

    const disabled = contextualAdminLinks([], [], "residential");
    expect(disabled.map((link) => link.href)).not.toContain("/admin");
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
        "/admin/checkpoints",
        "/admin/checkpoints/console",
        "/admin/invitations",
        "/admin/passages",
      ]),
    );
    expect(
      contextualAdminLinks(["residential"], [], "residential").map(
        (link) => link.href,
      ),
    ).not.toContain("/admin/checkpoints");
  });
  it("exposes leases in the residential sidebar only when the leases module is enabled", () => {
    const enabled = contextualAdminLinks(
      ["residential", "leases", "charges"],
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
      contextualAdminLinks(["residential", "charges"], [], "residential").map(
        (link) => link.href,
      ),
    ).not.toContain("/admin/residential/leases");
  });

  it("resolves legacy navigation module keys against the site module catalogue", () => {
    // Site modules report "billing"; the residential Finance group still asks
    // for "charges". Both must resolve to the same enabled module.
    const links = contextualAdminLinks(
      ["residential", "billing", "access_control", "communication"],
      [],
      "residential",
    );
    const hrefs = links.map((link) => link.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/admin/charges",
        "/admin/checkpoints",
        "/admin/invitations",
        "/admin/passages",
      ]),
    );
    const billing = links.find((link) => link.href === "/admin/charges");
    expect(billing?.children?.map((child) => child.href)).toEqual([
      "/admin/charges",
      "/admin/residential/finance",
    ]);
    expect(isModuleEnabled("charges", ["billing"])).toBe(true);
    expect(isModuleEnabled("charges", ["residential"])).toBe(false);
    expect(isModuleEnabled(undefined, [])).toBe(true);
  });
});
