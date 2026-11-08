import { buildSubdomainUrl } from "@/lib/subdomain-utils";
import type { Organization } from "@/types";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "past_due"]);

export function resolvePostAuthDestination(
  organizations: Organization[],
): string {
  if (organizations.length !== 1) {
    return "/organizations";
  }

  const organization = organizations[0];
  const destination = ACTIVE_SUBSCRIPTION_STATUSES.has(
    organization.subscription?.status || "",
  )
    ? "/organization"
    : "/plans";

  return buildSubdomainUrl(organization.slug, destination);
}
