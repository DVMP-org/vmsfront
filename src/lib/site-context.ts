import { getCookie } from "@/lib/cookies";

/** Site hints select a scope; server workspace authorization remains authoritative. */
export function siteIdFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("site_id") || params.get("site") || null;
}

export function storedSiteId(organizationSlug: string | null): string | null {
  return organizationSlug &&
    getCookie("selected-site-organization") === organizationSlug
    ? getCookie("selected-site")
    : null;
}

/**
 * Add the Site hint to a Site-scoped shell URL.
 *
 * `/admin/**` is Site administration and `/plugins/**` is a Site-scoped plugin
 * shell; both need the hint so a direct load (or a link that drops it) still
 * resolves an active Site for the plugin guard.
 */
export function withSite(href: string, siteId?: string | null): string {
  if (!siteId || !/^\/(?:admin|plugins)(?:[/?#]|$)/.test(href)) return href;
  const url = new URL(href, "https://vms.invalid");
  if (!url.searchParams.has("site_id") && !url.searchParams.has("site")) {
    url.searchParams.set("site_id", siteId);
  }
  return url.pathname + url.search + url.hash;
}
