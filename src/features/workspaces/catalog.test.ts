import { describe, expect, it } from "vitest";
import type { Admin, WorkspaceRelationship } from "@/types";
import {
  areaForRelationship,
  buildPropertyWorkspaces,
  buildWorkspaceCards,
  canOpenManagementDashboard,
  qualifiedPlaceName,
  roleLabel,
  workspaceDisplayName,
} from "./catalog";

function relationship(role: string, placeId: string): WorkspaceRelationship {
  return {
    id: `relationship-${role}`,
    organization_id: "org",
    role,
    status: "active",
    effective_from: null,
    effective_to: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    party: {
      id: "party",
      kind: "person",
      display_name: "Alex Morgan",
      email: "alex@example.com",
      is_active: true,
    },
    place: {
      id: placeId,
      name: `Place ${placeId}`,
      slug: placeId,
      kind: "unit",
      is_active: true,
    },
  };
}

describe("workspace catalog", () => {
  it("keeps management, occupancy, staff and guest access separate", () => {
    const admin = {
      role: { name: "Super Admin", permissions_parsed: ["*"] },
    } as Admin;
    const cards = buildWorkspaceCards(admin, [
      relationship("admin", "organization"),
      relationship("resident", "home"),
      relationship("tenant", "office"),
      relationship("employee", "hotel"),
      relationship("guest_of", "hotel"),
    ], relationship("admin", "organization").place);

    expect(cards.map((card) => card.area)).toEqual([
      "management",
      "occupancy",
      "occupancy",
      "staff",
      "guest",
    ]);
    expect(cards[0].roleLabel).toBe("Super administrator");
    expect(cards[0].title).toBe("Place organization management");
    expect(cards.at(-1)?.href).toBe("/workspace/hotel");
    expect(cards.find((card) => card.area === "guest")?.title).toMatch(
      /Stay at/,
    );
  });

  it("does not create a management dashboard before a place admin exists", () => {
    const admin = {
      role: { name: "Super Admin", permissions_parsed: ["*"] },
    } as Admin;

    expect(buildWorkspaceCards(admin, [])).toEqual([]);
  });

  it("does not infer management from an admin profile with no grants", () => {
    const profile = {
      role: null,
      roles: [],
      effective_permissions: ["profile.show"],
    } as unknown as Admin;

    const [workspace] = buildPropertyWorkspaces({
      admin: profile,
      relationships: [relationship("resident", "home")],
      managedPlaces: [relationship("admin", "organization").place],
    });

    expect(workspace.accesses.map((access) => access.area)).toEqual([
      "occupancy",
    ]);
  });

  it("requires a selected place and place-admin authority for the dashboard", () => {
    expect(canOpenManagementDashboard(null, true)).toBe(false);
    expect(canOpenManagementDashboard("place", false)).toBe(false);
    expect(canOpenManagementDashboard("place", true)).toBe(true);
  });

  it("classifies tenant roles as occupancy and formats labels", () => {
    expect(areaForRelationship(relationship("resident_of", "home"))).toBe(
      "occupancy",
    );
    expect(areaForRelationship(relationship("hotel_staff", "hotel"))).toBe(
      "staff",
    );
    expect(areaForRelationship(relationship("guest", "hotel"))).toBe("guest");
    expect(roleLabel("guest_of")).toBe("Guest");
  });

  it("only attaches management to the place that grants administration", () => {
    const admin = {
      role: { name: "Super Admin", permissions_parsed: ["*"] },
    } as Admin;
    const workspaces = buildPropertyWorkspaces({
      admin,
      relationships: [
        relationship("resident", "home"),
        relationship("guest_of", "hotel"),
      ],
      managedSites: [
        {
          assignment_id: "site-admin",
          role: "site_admin",
          site: {
            id: "organization",
            name: "Harbour Estate",
            slug: "harbour-estate",
            parent_site_id: null,
            is_active: true,
            use_case: "mixed_use",
          },
          effective_permissions: ["*"],
        },
      ],
    });

    expect(workspaces).toHaveLength(3);
    expect(
      workspaces
        .find((workspace) => workspace.place.id === "organization")
        ?.accesses.map((access) => access.area),
    ).toEqual(["management"]);
    expect(
      workspaces
        .find((workspace) => workspace.place.id === "home")
        ?.accesses.map((access) => access.area),
    ).toEqual(["occupancy"]);
    expect(
      workspaces
        .find((workspace) => workspace.place.id === "hotel")
        ?.accesses.map((access) => access.area),
    ).toEqual(["guest"]);
  });

  it("keeps independent management and tenancy access on one property", () => {
    const admin = {
      role: { name: "Estate Manager", permissions_parsed: [] },
    } as Admin;
    const tenancy = {
      ...relationship("tenant", "office"),
      id: "tenancy",
    };
    const [workspace] = buildPropertyWorkspaces({
      admin,
      relationships: [tenancy],
      managedSites: [
        {
          assignment_id: "site-admin",
          role: "site_admin",
          site: {
            id: "office",
            name: "Harbour Offices",
            slug: "harbour-offices",
            parent_site_id: null,
            is_active: true,
            use_case: "commercial",
          },
          effective_permissions: ["*"],
        },
      ],
    });

    expect(workspace.accesses.map((access) => access.area)).toEqual([
      "management",
      "occupancy",
    ]);
    expect(workspace.accesses[0].roleLabel).toBe("Estate Manager");
    expect(workspace.accesses[1].roleLabel).toBe("Tenant");
  });

  it("qualifies non-site workspace titles with the API-provided site", () => {
    const occupant = relationship("resident", "apartment");
    occupant.place.name = "Apartment 4B";
    occupant.place.site_name = "Harbour Court";

    const [workspace] = buildPropertyWorkspaces({
      admin: null,
      relationships: [occupant],
    });

    expect(qualifiedPlaceName(occupant.place)).toBe(
      "Harbour Court - Apartment 4B",
    );
    expect(workspaceDisplayName(workspace)).toBe(
      "Harbour Court - Apartment 4B",
    );
  });

  it("uses the managed path when site metadata is absent", () => {
    const unit = relationship("resident", "apartment").place;
    unit.name = "Apartment 4B";
    const site = relationship("admin", "site").place;
    site.name = "Harbour Court";
    site.kind = "site";

    expect(qualifiedPlaceName(unit, [site, unit])).toBe(
      "Harbour Court - Apartment 4B",
    );
  });
});
