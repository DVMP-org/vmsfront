import { describe, expect, it } from "vitest";

import { placeAssignmentCopyFor, placeRolesFor } from "./roles";

describe("place relationship vocabulary", () => {
  it("uses household roles for residential sites", () => {
    expect(placeRolesFor("residential").map((role) => role.value)).toEqual([
      "resident",
      "owner",
      "tenant",
      "household_member",
    ]);
    expect(placeAssignmentCopyFor("residential").title).toBe("Assign resident");
  });

  it("uses business roles for commercial sites", () => {
    const roles = placeRolesFor("commercial").map((role) => role.value);
    expect(roles).toEqual(["tenant", "member"]);
    expect(roles).not.toContain("resident");
    expect(placeAssignmentCopyFor("commercial")).toMatchObject({
      title: "Add party to this space",
      placeLabel: "Commercial space",
      newPartyLabel: "New business Party",
    });
  });

  it("keeps guest and member roles distinct for hospitality", () => {
    expect(placeRolesFor("hospitality").map((role) => role.value)).toEqual([
      "guest",
      "member",
    ]);
  });

  it("covers both households and businesses in mixed-use sites", () => {
    const roles = placeRolesFor("mixed_use").map((role) => role.value);
    expect(roles).toEqual(
      expect.arrayContaining(["resident", "owner", "tenant", "member"]),
    );
  });

  it("falls back to residential vocabulary when the use case is unknown", () => {
    expect(placeRolesFor(undefined)[0].value).toBe("resident");
  });
});
