import { describe, expect, it } from "vitest";

import type { PolicyEntry, PolicyValue } from "./api";
import {
    formatPolicyValue,
    policyDraftChanges,
    policySourceLabel,
    policyValuesEqual,
} from "./lib";

const policy = (overrides: Partial<PolicyEntry>): PolicyEntry =>
    ({
        key: "access.invitation.max_guests",
        name: "Maximum guests per invitation",
        description: "Zero means no limit.",
        category: "module",
        owner: "access_control",
        module: "access_control",
        domains: ["residential"],
        value_type: "integer",
        default: 0,
        group: "access_operations",
        group_label: "Access operations",
        options: [],
        minimum: "0",
        maximum: "100",
        unit: "guests",
        site_overridable: true,
        template_configurable: true,
        guardrail: false,
        enforcement: "VisitAuthorizationService.create_authorization",
        permissions: ["settings.update"],
        definition_version: 1,
        deprecated: false,
        replaced_by: null,
        effective_value: 0,
        source: "platform_default",
        site_override_value: null,
        has_site_override: false,
        template_value: null,
        template_id: null,
        template_name: null,
        editable: true,
        ...overrides,
    }) as PolicyEntry;

describe("policy formatting", () => {
    it("shows a documented zero as no limit", () => {
        expect(formatPolicyValue(policy({}), 0)).toBe("No limit");
    });

    it("does not hide a zero that is a real value", () => {
        expect(
            formatPolicyValue(policy({ description: "A hard cap." }), 0),
        ).toBe("0 guests");
    });

    it("uses enum labels", () => {
        const definition = policy({
            value_type: "enum",
            options: [{ value: "warn", label: "Allow with a warning" }],
            unit: null,
        });
        expect(formatPolicyValue(definition, "warn")).toBe(
            "Allow with a warning",
        );
    });

    it("labels configuration sources for people", () => {
        expect(policySourceLabel("site_override")).toBe("This site");
        expect(policySourceLabel("platform_default")).toBe("Platform default");
    });
});

describe("policy drafts", () => {
    const base = policy({ effective_value: 4 });

    it("treats an explicit false as different from unset", () => {
        expect(policyValuesEqual(false, false)).toBe(true);
        expect(policyValuesEqual(false, 0 as PolicyValue)).toBe(false);
    });

    it("returns only changed policies", () => {
        const unchanged = policyDraftChanges([base], { [base.key]: 4 });
        expect(unchanged).toHaveLength(0);

        const changed = policyDraftChanges([base], { [base.key]: 8 });
        expect(changed).toHaveLength(1);
        expect(changed[0].value).toBe(8);
    });
});
