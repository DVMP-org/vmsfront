/**
 * Pure helpers for the organization onboarding flow:
 * create organization -> choose plan -> create the first Site.
 *
 * Everything a screen needs to explain the flow lives here so the three steps
 * cannot drift apart in wording, validation or formatting.
 */

import type {
    ContextCatalog,
    ModuleGroup,
    UseCase,
} from "@/features/context/api";
import type { BillingDetails } from "@/services/subscription-service";
import type { Plan } from "@/types/subscription";
import { humanize } from "@/lib/strings";

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

export type OnboardingStepId = "organization" | "plan" | "site";

export interface OnboardingStep {
    id: OnboardingStepId;
    label: string;
    /** What the person does in this step. */
    action: string;
    /** What they walk away with. */
    outcome: string;
    href: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: "organization",
        label: "Organization",
        action: "Name the organization and claim its workspace URL.",
        outcome: "Your tenant exists with you as its first owner.",
        href: "/organizations/create",
    },
    {
        id: "plan",
        label: "Plan",
        action: "Choose the capabilities the organization may use.",
        outcome: "The plan is active for every Site you add.",
        href: "/plans?setup=first-site",
    },
    {
        id: "site",
        label: "First Site",
        action: "Create the Site that owns Places, people and access.",
        outcome: "The management workspace opens with your operating type.",
        href: "/setup/first-site",
    },
];

export function onboardingStep(id: OnboardingStepId): OnboardingStep {
    return ONBOARDING_STEPS.find((step) => step.id === id) ?? ONBOARDING_STEPS[0];
}

export type OnboardingStepState = "complete" | "current" | "upcoming";

export function onboardingStepState(
    step: OnboardingStepId,
    current: OnboardingStepId,
): OnboardingStepState {
    const stepIndex = ONBOARDING_STEPS.findIndex((entry) => entry.id === step);
    const currentIndex = ONBOARDING_STEPS.findIndex(
        (entry) => entry.id === current,
    );
    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
}

/** `Step 1 of 3` eyebrow copy. */
export function stepCounter(id: OnboardingStepId): string {
    const index = ONBOARDING_STEPS.findIndex((step) => step.id === id);
    return `Step ${index + 1} of ${ONBOARDING_STEPS.length}`;
}

/* -------------------------------------------------------------------------- */
/* Organization identity                                                      */
/* -------------------------------------------------------------------------- */

export interface OrganizationDraft {
    name: string;
    slug: string;
    description: string;
    slugManuallyEdited: boolean;
}

export const emptyOrganizationDraft: OrganizationDraft = {
    name: "",
    slug: "",
    description: "",
    slugManuallyEdited: false,
};

export const ORGANIZATION_DRAFT_KEY = "organization-create-draft-v1";
export const SLUG_TAKEN_MESSAGE =
    "This workspace URL is already in use. Choose a different URL.";

export function normalizeSlugInput(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function validateOrganizationDraft(
    draft: OrganizationDraft,
): Partial<Record<keyof OrganizationDraft, string>> {
    const errors: Partial<Record<keyof OrganizationDraft, string>> = {};
    if (!draft.name.trim()) {
        errors.name = "Enter the organization name.";
    }
    if (draft.slug.length < 2) {
        errors.slug = "Use at least 2 characters for the workspace URL.";
    } else if (!/^[a-z0-9-]+$/.test(draft.slug)) {
        errors.slug = "Use lowercase letters, numbers and hyphens only.";
    }
    if (draft.description.length > 500) {
        errors.description = "Keep the description under 500 characters.";
    }
    return errors;
}

/* -------------------------------------------------------------------------- */
/* Operating types                                                            */
/* -------------------------------------------------------------------------- */

export interface OperatingTypeProfile {
    value: UseCase;
    label: string;
    tagline: string;
    examples: string;
    /** The first things an operator can do the moment the Site exists. */
    highlights: string[];
}

export const OPERATING_TYPES: OperatingTypeProfile[] = [
    {
        value: "residential",
        label: "Residential",
        tagline: "Homes, estates and apartment blocks run for residents.",
        examples: "Estate, apartment block, gated community",
        highlights: [
            "Residents, owners and households",
            "Visitor invitations and gate passes",
            "Service charges and levies",
        ],
    },
    {
        value: "commercial",
        label: "Commercial",
        tagline: "Offices, retail and business parks run for tenants.",
        examples: "Office park, mall, warehouse",
        highlights: [
            "Tenants, staff and contractors",
            "Contractor access and check-in",
            "Rent and facility charges",
        ],
    },
    {
        value: "hospitality",
        label: "Hospitality",
        tagline: "Hotels, serviced apartments and hostels run for guests.",
        examples: "Hotel, serviced apartment, hostel",
        highlights: [
            "Guest register and check-in",
            "Rooms, buildings and units",
            "Guest access credentials",
        ],
    },
    {
        value: "mixed_use",
        label: "Mixed use",
        tagline: "One Site that combines homes, businesses and guest stays.",
        examples: "Live-work estate, resort with residences",
        highlights: [
            "Residential, commercial and hospitality",
            "One gate and access policy",
            "Charges split by operating mode",
        ],
    },
];

const OPERATING_TYPE_BY_VALUE = new Map(
    OPERATING_TYPES.map((profile) => [profile.value, profile]),
);

export function operatingTypeProfile(
    value: UseCase | string | null | undefined,
): OperatingTypeProfile | undefined {
    if (!value) return undefined;
    return OPERATING_TYPE_BY_VALUE.get(value as UseCase);
}

export function operatingTypeLabel(value: UseCase | string): string {
    return operatingTypeProfile(value)?.label ?? humanize(value);
}

/** Profiles for every type the catalogue knows, in the catalogue's order. */
export function operatingTypesFor(
    catalog?: ContextCatalog | null,
): OperatingTypeProfile[] {
    const catalogueTypes = catalog?.use_cases ?? [];
    if (!catalogueTypes.length) return OPERATING_TYPES;

    return catalogueTypes.map((entry) => {
        const known = operatingTypeProfile(entry.value);
        if (known) return { ...known, label: entry.label || known.label };
        return {
            value: entry.value,
            label: entry.label || humanize(entry.value),
            tagline: "Capabilities for this type of operation.",
            examples: "",
            highlights: (entry.modules ?? []).slice(0, 3).map(moduleLabel),
        };
    });
}

/* -------------------------------------------------------------------------- */
/* Capabilities                                                               */
/* -------------------------------------------------------------------------- */

const MODULE_LABELS: Record<string, string> = {
    dashboard: "Operations dashboard",
    properties: "Sites, buildings and units",
    people: "People directory",
    contractors: "Contractors and permits",
    check_in_out: "Check-in and check-out",
    gates: "Gates and checkpoints",
    charges: "Charges and invoicing",
    forum: "Resident forum",
    admins: "Administrators",
    roles: "Roles and permissions",
    organization_settings: "Organization settings",
    plugins: "Plugins",
    integrations: "Integrations",
    residential: "Residential operations",
    commercial: "Commercial operations",
    hospitality: "Hospitality operations",
};

/** Human sentence for a module key; the server only ever sends machine values. */
export function moduleLabel(module: string): string {
    return MODULE_LABELS[module] ?? humanize(module);
}

const CORE_CAPABILITY_GROUPS: ModuleGroup[] = [
    {
        key: "operations",
        label: "Operations",
        modules: ["dashboard", "properties", "people"],
    },
    { key: "access", label: "Access", modules: ["check_in_out", "gates"] },
    {
        key: "staff",
        label: "Staff & contractors",
        modules: ["contractors"],
    },
    { key: "finance", label: "Finance", modules: ["charges"] },
    { key: "community", label: "Community", modules: ["forum"] },
    {
        key: "administration",
        label: "Administration",
        modules: ["admins", "roles", "organization_settings"],
    },
    {
        key: "extensions",
        label: "Extensions",
        modules: ["plugins", "integrations"],
    },
];

const SPECIALIST_CAPABILITY_GROUPS: Record<UseCase, ModuleGroup[]> = {
    residential: [
        {
            key: "residential",
            label: "Residential operations",
            modules: ["residential"],
        },
    ],
    commercial: [
        {
            key: "commercial",
            label: "Commercial operations",
            modules: ["commercial"],
        },
    ],
    hospitality: [
        {
            key: "hospitality",
            label: "Hospitality operations",
            modules: ["hospitality"],
        },
    ],
    mixed_use: [
        {
            key: "residential",
            label: "Residential operations",
            modules: ["residential"],
        },
        {
            key: "commercial",
            label: "Commercial operations",
            modules: ["commercial"],
        },
        {
            key: "hospitality",
            label: "Hospitality operations",
            modules: ["hospitality"],
        },
    ],
};

/**
 * Grouped capabilities a Site receives for an operating type. Prefers the
 * server catalogue and falls back to the shared taxonomy so the setup screen
 * still explains itself when the catalogue is offline.
 */
export function capabilitiesFor(
    useCase: UseCase,
    catalog?: ContextCatalog | null,
): ModuleGroup[] {
    const fromCatalogue = catalog?.use_cases?.find(
        (entry) => entry.value === useCase,
    )?.module_groups;

    const usable = (fromCatalogue ?? []).filter(
        (group) => group.modules && group.modules.length > 0,
    );
    if (usable.length) return usable;

    return [
        ...CORE_CAPABILITY_GROUPS,
        ...(SPECIALIST_CAPABILITY_GROUPS[useCase] ?? []),
    ];
}

export function capabilityCount(groups: ModuleGroup[]): number {
    return groups.reduce((total, group) => total + group.modules.length, 0);
}

/* -------------------------------------------------------------------------- */
/* First Site                                                                 */
/* -------------------------------------------------------------------------- */

export interface FirstSiteDraft {
    name: string;
    address: string;
    description: string;
    adminEmail: string;
    adminName: string;
    adminPhone: string;
    useCase: UseCase | "";
}

export const emptyFirstSiteDraft: FirstSiteDraft = {
    name: "",
    address: "",
    description: "",
    adminEmail: "",
    adminName: "",
    adminPhone: "",
    useCase: "",
};

export function validateFirstSiteDraft(
    draft: FirstSiteDraft,
): Partial<Record<keyof FirstSiteDraft, string>> {
    const errors: Partial<Record<keyof FirstSiteDraft, string>> = {};
    if (!draft.name.trim()) {
        errors.name = "Enter the name operators will recognise.";
    } else if (draft.name.trim().length < 2) {
        errors.name = "Use at least 2 characters.";
    }
    if (!draft.useCase) {
        errors.useCase = "Choose the operating type this Site owns.";
    }
    if (!draft.adminEmail.trim()) {
        errors.adminEmail = "Enter the Site administrator email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.adminEmail.trim())) {
        errors.adminEmail = "Enter a valid email address.";
    }
    if (draft.description.length > 500) {
        errors.description = "Keep the description under 500 characters.";
    }
    return errors;
}

/* -------------------------------------------------------------------------- */
/* Plans and billing                                                          */
/* -------------------------------------------------------------------------- */

export type BillingCycle = "monthly" | "yearly";

export interface BillingFormState {
    billing_email: string;
    billing_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    tax_id: string;
}

export const emptyBillingForm: BillingFormState = {
    billing_email: "",
    billing_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    tax_id: "",
};

export const BILLING_COUNTRIES = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "NL", name: "Netherlands", flag: "🇳🇱" },
    { code: "ES", name: "Spain", flag: "🇪🇸" },
    { code: "IT", name: "Italy", flag: "🇮🇹" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "BR", name: "Brazil", flag: "🇧🇷" },
    { code: "MX", name: "Mexico", flag: "🇲🇽" },
    { code: "SG", name: "Singapore", flag: "🇸🇬" },
    { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦" },
    { code: "KE", name: "Kenya", flag: "🇰🇪" },
    { code: "GH", name: "Ghana", flag: "🇬🇭" },
];

export function planPriceFor(plan: Plan, cycle: BillingCycle): number {
    return cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
}

export function planMonthlyEquivalent(plan: Plan, cycle: BillingCycle): number {
    return cycle === "yearly" ? plan.price_yearly / 12 : plan.price_monthly;
}

/** Whole-percent saving of the yearly price over twelve monthly payments. */
export function planSavingsPercent(plan: Plan): number {
    const yearlyList = plan.price_monthly * 12;
    if (!yearlyList || plan.price_yearly >= yearlyList) return 0;
    return Math.round(((yearlyList - plan.price_yearly) / yearlyList) * 100);
}

export function planRequiresPayment(plan: Plan | undefined, cycle: BillingCycle) {
    if (!plan) return false;
    return planPriceFor(plan, cycle) > 0;
}

/** `features` arrives as an untyped map; render it as readable bullet copy. */
export function planFeatureEntries(plan: Plan): string[] {
    const features = plan.features ?? {};
    return Object.entries(features).map(([key, value]) => {
        if (typeof value === "boolean") return humanize(key);
        if (value === null || value === undefined || value === "") {
            return humanize(key);
        }
        return `${humanize(key)}: ${String(value)}`;
    });
}

export function validateBillingForm(
    billing: BillingFormState,
): Partial<Record<keyof BillingFormState, string>> {
    const errors: Partial<Record<keyof BillingFormState, string>> = {};
    if (!billing.billing_email) {
        errors.billing_email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.billing_email)) {
        errors.billing_email = "Please enter a valid email";
    }
    if (!billing.billing_name) errors.billing_name = "Name is required";
    if (!billing.address_line1) {
        errors.address_line1 = "Street address is required";
    }
    if (!billing.city) errors.city = "City is required";
    if (!billing.country) errors.country = "Country is required";
    return errors;
}

/** Only send values the person actually filled in. */
export function buildBillingPayload(billing: BillingFormState): BillingDetails {
    const payload: BillingDetails = {};
    for (const [key, value] of Object.entries(billing)) {
        if (value) payload[key as keyof BillingFormState] = value;
    }
    return payload;
}
