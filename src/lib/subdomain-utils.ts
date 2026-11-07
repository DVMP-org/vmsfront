import {
  createSubdomainUtilities,
  RESERVED_SUBDOMAINS,
} from "@vms/api-client/subdomain-utils";

const subdomains = createSubdomainUtilities({
  baseDomain: process.env.NEXT_PUBLIC_BASE_DOMAIN || "vmsfront.to",
});

export { RESERVED_SUBDOMAINS };
export const getSubdomain = subdomains.getSubdomain;
export const isBaseDomain = subdomains.isBaseDomain;
export const buildSubdomainUrl = subdomains.buildSubdomainUrl;
