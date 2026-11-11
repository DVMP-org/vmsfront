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

export function withSite(href: string, siteId?: string | null): string {
  if (!siteId || !/^\/admin(?:[/?#]|$)/.test(href)) return href;
  const url = new URL(href, "https://vms.invalid");
  if (!url.searchParams.has("site_id") && !url.searchParams.has("site")) {
    url.searchParams.set("site_id", siteId);
  }
  return url.pathname + url.search + url.hash;
}
