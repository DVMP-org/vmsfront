import { describe, expect, it } from "vitest";

import type { ContextCatalog } from "@/features/context/api";
import type { Plan } from "@/types/subscription";

import {
    capabilityCount,
    capabilitiesFor,
    emptyFirstSiteDraft,
    emptyOrganizationDraft,
    moduleLabel,
    onboardingStepState,
    operatingTypeProfile,
    operatingTypesFor,
    planFeatureEntries,
    planMonthlyEquivalent,
    planRequiresPayment,
    planSavingsPercent,
    stepCounter,
    validateBillingForm,
    validateFirstSiteDraft,
    validateOrganizationDraft,
} from "./lib";

const plan: Plan = {
    id: "pro",
    name: "Pro",
    slug: "pro",
    description: "Everything",
    price_monthly: 100,
    price_yearly: 1000,
    features: { unlimited_sites: true, gates: 5 },
    trial_days: 14,
    is_active: true,
    sort_order: 1,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
};

const catalog: ContextCatalog = {
    contract_version: "vmscore.context/v2",
    module_groups: [],
    specialist_groups: [],
    use_cases: [
        {
            value: "hospitality",
            label: "Hospitality",
            modules: ["dashboard"],
            module_groups: [
                { key: "access", label: "Access", modules: ["check_in_out"] },
            ],
        },
    ],
    building_types: [],
    common_modules: [],
    structure_kinds: [],
};

describe("onboarding steps", () => {
    it("reports complete, current and upcoming steps", () => {
        expect(onboardingStepState("organization", "plan")).toBe("complete");
        expect(onboardingStepState("plan", "plan")).toBe("current");
        expect(onboardingStepState("site", "plan")).toBe("upcoming");
        expect(stepCounter("organization")).toBe("Step 1 of 3");
        expect(stepCounter("site")).toBe("Step 3 of 3");
    });
});

describe("organization draft", () => {
    it("requires a name and a usable workspace URL", () => {
        expect(validateOrganizationDraft(emptyOrganizationDraft)).toEqual({
            name: "Enter the organization name.",
            slug: "Use at least 2 characters for the workspace URL.",
        });
        expect(
            validateOrganizationDraft({
                name: "Harbour",
                slug: "harbour",
                description: "",
                slugManuallyEdited: true,
            }),
        ).toEqual({});
    });
});

describe("capabilities", () => {
    it("prefers the server catalogue and falls back to the shared taxonomy", () => {
        expect(capabilitiesFor("hospitality", catalog)).toEqual([
            { key: "access", label: "Access", modules: ["check_in_out"] },
        ]);

        const fallback = capabilitiesFor("residential");
        expect(fallback.map((group) => group.key)).toContain("residential");
        expect(capabilityCount(fallback)).toBeGreaterThan(0);
    });

    it("humanises module keys", () => {
        expect(moduleLabel("check_in_out")).toBe("Check-in and check-out");
        expect(moduleLabel("unknown_module")).toBe("Unknown module");
    });

    it("falls back to the built-in operating types when the catalogue is missing", () => {
        expect(operatingTypesFor(null).map((type) => type.value)).toEqual([
            "residential",
            "commercial",
            "hospitality",
            "mixed_use",
        ]);
        expect(operatingTypeProfile("mixed_use")?.label).toBe("Mixed use");
        expect(operatingTypesFor(catalog)[0].label).toBe("Hospitality");
    });
});

describe("first Site draft", () => {
    it("requires a name, an operating type and a valid administrator email", () => {
        const errors = validateFirstSiteDraft({
            ...emptyFirstSiteDraft,
            adminEmail: "not-an-email",
        });
        expect(errors.name).toBeTruthy();
        expect(errors.useCase).toBeTruthy();
        expect(errors.adminEmail).toBe("Enter a valid email address.");
    });
});

describe("plans", () => {
    it("derives monthly price, savings and payment requirement", () => {
        expect(planMonthlyEquivalent(plan, "yearly")).toBeCloseTo(83.33, 2);
        expect(planSavingsPercent(plan)).toBe(17);
        expect(planRequiresPayment(plan, "monthly")).toBe(true);
        expect(planRequiresPayment(undefined, "monthly")).toBe(false);
        expect(planFeatureEntries(plan)).toEqual(["Unlimited sites", "Gates: 5"]);
    });

    it("only flags the required billing fields", () => {
        expect(
            Object.keys(
                validateBillingForm({
                    billing_email: "",
                    billing_name: "",
                    address_line1: "",
                    address_line2: "",
                    city: "",
                    state: "",
                    postal_code: "",
                    country: "",
                    tax_id: "",
                }),
            ),
        ).toEqual(["billing_email", "billing_name", "address_line1", "city", "country"]);
    });
});
