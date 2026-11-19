const configuredSite =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_DOMAIN ||
  "vmscore.to";
export const marketingSiteUrl = configuredSite.includes("://")
  ? configuredSite
  : `https://${configuredSite}`;
