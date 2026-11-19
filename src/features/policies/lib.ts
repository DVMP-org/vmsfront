import type {
    PolicyEntry,
    PolicySource,
    PolicyValue,
} from "./api";

export type PolicyDisplayDefinition = Pick<
    PolicyEntry,
    | "value_type"
    | "options"
    | "unit"
    | "description"
    | "minimum"
    | "maximum"
>;

const SOURCE_LABELS: Record<PolicySource | "site_assignment", string> = {
    platform_guardrail: "Platform guardrail",
    platform_default: "Platform default",
    domain_default: "Operating standard",
    organization_template: "Organization standard",
    site_override: "This site",
    site_assignment: "Template assigned",
};

export function policySourceLabel(source: PolicySource): string {
    return SOURCE_LABELS[source] ?? source;
}

export function policySourceTone(
    source: PolicySource,
): "neutral" | "info" | "accent" {
    if (source === "site_override") return "accent";
    if (
        source === "organization_template" ||
        source === "domain_default"
    ) {
        return "info";
    }
    return "neutral";
}

/** The value a control starts from; guardrails and defaults included. */
export function initialPolicyValue(policy: PolicyEntry): PolicyValue {
    return policy.effective_value;
}

export function policyValuesEqual(a: PolicyValue, b: PolicyValue): boolean {
    if (Array.isArray(a) || Array.isArray(b)) {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    if (a && b && typeof a === "object" && typeof b === "object") {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    return a === b;
}

/**
 * Render a policy value in the operator's words. Zero means "no limit" only
 * when the definition says so in its own description; otherwise it is a real
 * zero and must not be hidden.
 */
export function formatPolicyValue(
    policy: PolicyDisplayDefinition,
    value: PolicyValue | null,
): string {
    if (value === null || value === undefined) return "Not set";
    if (policy.value_type === "boolean") return value ? "Yes" : "No";
    if (policy.value_type === "enum") {
        const option = policy.options.find((item) => item.value === value);
        return option?.label ?? String(value);
    }
    if (policy.value_type === "time_window" && typeof value === "object") {
        const window = value as { start?: string; end?: string };
        if (window.start && window.end) return `${window.start}–${window.end}`;
        return "Not set";
    }
    if (policy.value_type === "integer") {
        const numeric = Number(value);
        if (numeric === 0 && /zero means/i.test(policy.description)) {
            return "No limit";
        }
        return `${numeric}${policy.unit ? ` ${policy.unit}` : ""}`.trim();
    }
    if (policy.value_type === "decimal" || policy.value_type === "threshold") {
        const numeric = Number(value);
        return `${numeric}${policy.unit ? ` ${policy.unit}` : ""}`.trim();
    }
    return String(value);
}

export function policyDraftChanges(
    policies: PolicyEntry[],
    drafts: Record<string, PolicyValue>,
): Array<{ policy: PolicyEntry; value: PolicyValue }> {
    return policies
        .filter((policy) => policy.key in drafts)
        .filter(
            (policy) => !policyValuesEqual(drafts[policy.key], policy.effective_value),
        )
        .map((policy) => ({ policy, value: drafts[policy.key] }));
}

export function numericBound(
    policy: PolicyDisplayDefinition,
    bound: "minimum" | "maximum",
): number | undefined {
    const raw = policy[bound];
    if (raw === null || raw === "") return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function toNumericInput(value: PolicyValue): number | "" {
    if (value === "" || value === null || value === undefined) return "";
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : "";
}
