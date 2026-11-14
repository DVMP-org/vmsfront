import { siteIdFromSearch, storedSiteId } from "@/lib/site-context";
import {
  createApiClient,
  createCookieUtilities,
  createSubdomainUtilities,
  getStoredAuthToken as readStoredAuthToken,
} from "@vms/api-client";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

// The Valet gateway exposes the API without a port in local and hosted use.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vmscore.to";

const cookies = createCookieUtilities({
  baseDomain: process.env.NEXT_PUBLIC_BASE_DOMAIN || "",
});
const subdomains = createSubdomainUtilities({
  baseDomain: process.env.NEXT_PUBLIC_BASE_DOMAIN || "vmsfront.to",
});

export function getStoredAuthToken(): string | null {
  return readStoredAuthToken({ getCookie: cookies.getCookie });
}

export const apiClient = createApiClient({
  baseURL: API_URL,
  getToken: getStoredAuthToken,
  getOrganizationSlug: subdomains.getSubdomain,
  getPropertyId: () => {
    const selectedSiteId = useAppStore.getState().selectedSite?.id ?? null;
    if (typeof window === "undefined") return selectedSiteId;
    return (
      siteIdFromSearch(window.location.search) ||
      selectedSiteId ||
      storedSiteId(subdomains.getSubdomain())
    );
  },
  onUnauthorized: () => useAuthStore.getState().clearAuth(),
});
