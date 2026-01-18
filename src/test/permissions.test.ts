import { describe, it, expect } from "vitest";
import { hasPermission } from "../lib/permissions";
import { AdminRole } from "../types";

describe("hasPermission utility", () => {
    const baseRole: AdminRole = {
        id: "role-1",
        name: "Test Role",
        code: "TEST",
        description: null,
        permissions: [],
        permissions_parsed: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    it("should return false if role is null", () => {
        expect(hasPermission(null, "residents.list")).toBe(false);
    });

    describe("Dot notation array (permissions_parsed)", () => {
        it("should match exact permission", () => {
            const role = { ...baseRole, permissions_parsed: ["residents.list", "users.show"] };
            expect(hasPermission(role, "residents.list")).toBe(true);
            expect(hasPermission(role, "users.show")).toBe(true);
            expect(hasPermission(role, "houses.list")).toBe(false);
        });

        it("should handle super-admin wildcard", () => {
            const role = { ...baseRole, permissions_parsed: ["*"] };
            expect(hasPermission(role, "any.permission")).toBe(true);
        });

        it("should handle array of requirements (OR logic)", () => {
            const role = { ...baseRole, permissions_parsed: ["residents.list"] };
            expect(hasPermission(role, ["residents.list", "houses.list"])).toBe(true);
            expect(hasPermission(role, ["users.list", "houses.list"])).toBe(false);
        });
    });

    describe("Resource-action object (permissions)", () => {
        it("should match resource and action", () => {
            const role = {
                ...baseRole,
                permissions: { residents: ["list", "show"], users: ["create"] },
            };
            expect(hasPermission(role, "residents.list")).toBe(true);
            expect(hasPermission(role, "users.create")).toBe(true);
            expect(hasPermission(role, "residents.delete")).toBe(false);
        });

        it("should handle resource-wide wildcard", () => {
            const role = { ...baseRole, permissions: { residents: ["*"] } };
            expect(hasPermission(role, "residents.any")).toBe(true);
        });

        it("should handle global wildcard in object", () => {
            const role = { ...baseRole, permissions: { "*": ["*"] } };
            expect(hasPermission(role, "any.thing")).toBe(true);
        });
    });

    describe("Mixed or Super-admin String", () => {
        it("should handle super-admin string explicitly", () => {
            const role = { ...baseRole, permissions: "*" };
            expect(hasPermission(role, "any.permission")).toBe(true);
        });

        it("should handle array permissions format", () => {
            const role = { ...baseRole, permissions: ["residents.list", "*"] };
            expect(hasPermission(role, "any.permission")).toBe(true);
        });
    });
});
