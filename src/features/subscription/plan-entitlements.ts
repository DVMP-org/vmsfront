export interface PlanEntitlement {
  key: string;
  label: string;
  detail: string;
}

const limitLabels: Record<string, string> = {
  max_admins: "Organization administrators",
  max_residents: "Residents",
  max_gates: "Gates",
};

const benefitLabels: Record<string, string> = {
  priority_support: "Priority support",
  dedicated_account_manager: "Dedicated account manager",
  white_labeling: "White-label branding",
};

function readableKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function planEntitlements(
  features: Record<string, unknown> | null | undefined,
): PlanEntitlement[] {
  if (!features) return [];

  return Object.entries(features).flatMap(([key, value]) => {
    if (
      value === false ||
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    const label = limitLabels[key] ?? benefitLabels[key] ?? readableKey(key);
    if (value === true) return [{ key, label, detail: "Included" }];

    const limit =
      typeof value === "number" ||
      (typeof value === "string" && value.trim() !== "")
        ? Number(value)
        : Number.NaN;
    if (Number.isFinite(limit) && limit >= 0 && Number.isInteger(limit)) {
      return [{ key, label, detail: `${limit.toLocaleString()} included` }];
    }

    return [{ key, label, detail: "Contact your account team for details" }];
  });
}
