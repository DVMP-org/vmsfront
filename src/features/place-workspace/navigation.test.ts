import { describe, expect, it } from "vitest";
import { domainExperiences } from "@/config/domains";
import type { PlaceContext } from "./api";
import {
  placeWorkspaceNavigation,
  workspaceSectionAllowed,
} from "./navigation";
const context = {
  place: { id: "unit" },
  effective_use_case: "residential",
  modules: [
    "access_control",
    "people",
    "billing",
    "communication",
    "maintenance",
  ],
  is_place_admin: false,
} as PlaceContext;
describe("Place workspace navigation", () => {
  it("provides distinct sidebar and dashboard arrays for every domain", () => {
    for (const definition of Object.values(domainExperiences)) {
      expect(definition.workspace_navigation.length).toBeGreaterThan(0);
      expect(definition.workspace_dashboard.length).toBeGreaterThan(0);
      for (const item of definition.workspace_navigation.flatMap(
        (group) => group.items,
      ))
        expect(item.href).toMatch(/^\/workspace\/\{placeId\}/);
    }
  });
  it("hides unavailable modules and settings from ordinary residents", () => {
    const restricted = { ...context, modules: ["access_control"] };
    const hrefs = placeWorkspaceNavigation(restricted).flatMap((group) =>
      group.items.map((item) => item.href),
    );
    expect(hrefs).toContain("/workspace/unit/invitations");
    expect(hrefs).toContain("/workspace/unit/profile");
    expect(hrefs).not.toContain("/workspace/unit/charges");
    expect(hrefs).not.toContain("/workspace/unit/settings");
    expect(workspaceSectionAllowed(restricted, "settings")).toBe(false);
    expect(workspaceSectionAllowed(restricted, "unknown")).toBe(false);
  });
  it("shows settings only for a Place administrator", () => {
    expect(
      workspaceSectionAllowed({ ...context, is_place_admin: true }, "settings"),
    ).toBe(true);
    expect(workspaceSectionAllowed(context, "settings")).toBe(false);
  });
});
