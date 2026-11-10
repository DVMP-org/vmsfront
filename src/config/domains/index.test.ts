import { describe, expect, it } from "vitest";

import { domainExperiences } from ".";

describe("domain experience configuration", () => {
  it("validates all four domains and keeps routes unique within a domain", () => {
    expect(Object.keys(domainExperiences).sort()).toEqual([
      "commercial",
      "hospitality",
      "mixed_use",
      "residential",
    ]);
    for (const experience of Object.values(domainExperiences)) {
      const parentRoutes = experience.navigation.flatMap((group) =>
        group.items.map((item) => item.href),
      );
      expect(new Set(parentRoutes).size).toBe(parentRoutes.length);
      for (const item of experience.navigation.flatMap(
        (group) => group.items,
      )) {
        const childRoutes = item.children?.map((child) => child.href) ?? [];
        expect(new Set(childRoutes).size).toBe(childRoutes.length);
      }
      expect(experience.maintenance.workflow.length).toBeGreaterThan(4);
    }
  });

  it("presents mixed-use as one cohesive property experience", () => {
    const mixedUse = domainExperiences.mixed_use;
    expect(mixedUse.navigation.map((group) => group.label)).toEqual([
      "Property",
      "Leasing & revenue",
      "Operations",
      "Access",
    ]);
    expect(mixedUse.navigation.flatMap((group) => group.label)).not.toContain(
      "Residential operations",
    );
  });

  it("keeps gate and invitation consoles as first-level Access workflows", () => {
    for (const experience of Object.values(domainExperiences)) {
      const access = experience.navigation.find(
        (group) => group.id === "access",
      );
      expect(access?.label).toBe("Access");
      expect(access?.items.map((item) => item.href)).toEqual(
        expect.arrayContaining([
          "/admin/gates",
          "/admin/checkpoints/console",
          "/admin/invitations",
          "/admin/passages",
        ]),
      );
    }
  });
});
