import { describe, expect, it } from "vitest";

import {
    placeAssignmentCopyFor,
    placePartyKindFor,
    placeRolesFor,
} from "./roles";

describe("place relationship vocabulary", () => {
    it("uses household roles for residential sites", () => {
        expect(placeRolesFor("residential").map((role) => role.value)).toEqual([
            "resident",
            "owner",
            "tenant",
            "household_member",
        ]);
        expect(placePartyKindFor("residential")).toBe("person");
        expect(placeAssignmentCopyFor("residential").title).toBe("Assign resident");
    });

    it("uses business roles and allows organizations for commercial sites", () => {
        const roles = placeRolesFor("commercial").map((role) => role.value);
        expect(roles).toEqual(["tenant", "member"]);
        expect(roles).not.toContain("resident");
        expect(placePartyKindFor("commercial")).toBe("any");
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
        expect(placePartyKindFor("hospitality")).toBe("any");
    });

    it("covers both households and businesses in mixed-use sites", () => {
        const roles = placeRolesFor("mixed_use").map((role) => role.value);
        expect(roles).toEqual(
            expect.arrayContaining(["resident", "owner", "tenant", "member"]),
        );
    });

    it("falls back to residential vocabulary when the use case is unknown", () => {
        expect(placePartyKindFor(null)).toBe("person");
        expect(placeRolesFor(undefined)[0].value).toBe("resident");
    });
});
