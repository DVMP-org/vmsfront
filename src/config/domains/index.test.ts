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
      const routes = experience.navigation.flatMap((group) =>
        group.items.map((item) => `${item.href}:${item.label}`),
      );
      expect(new Set(routes).size).toBe(routes.length);
      expect(experience.maintenance.workflow.length).toBeGreaterThan(4);
    }
  });

  it("presents mixed-use as one cohesive property experience", () => {
    const mixedUse = domainExperiences.mixed_use;
    expect(mixedUse.navigation.map((group) => group.label)).toEqual([
      "Property",
      "Leasing & revenue",
      "Operations",
    ]);
    expect(mixedUse.navigation.flatMap((group) => group.label)).not.toContain(
      "Residential operations",
    );
  });
});
