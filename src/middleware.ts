import { NextResponse, type NextRequest } from "next/server";
import { RESERVED_SUBDOMAINS } from "@/lib/subdomain-utils";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "vmsfront.to";
const PROTOCOL = process.env.NODE_ENV === "production" ? "https" : "http";
const DEFAULT_ORGANIZATION_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG || "";

/**
 * Construct a URL on the base domain (without subdomain).
 *
 * Public hosts must never inherit the request/forwarded port: Valet and
 * container proxies forward the internal dev port (3000), which previously
 * produced redirects such as `https://vmsfront.to:3000/organizations`.
 * Only local development hosts keep their port so `localhost:3000` and
 * `lvh.me:3116` continue to work.
 */
function getBaseDomainUrl(
  pathname: string = "/",
  search: string = "",
  request?: NextRequest,
): URL {
  const requestUrl = request ? new URL(request.url) : null;
  const forwardedProtocol = request?.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const protocol =
    forwardedProtocol ||
    (requestUrl ? requestUrl.protocol.replace(":", "") : PROTOCOL);

  const firstHeader = (value?: string | null) =>
    value?.split(",")[0]?.trim() || "";
  const forwardedHost = firstHeader(request?.headers.get("x-forwarded-host"));
  const hostHeader = firstHeader(request?.headers.get("host"));
  const rawHost = forwardedHost || hostHeader || requestUrl?.host || BASE_DOMAIN;
  const [requestHostname, requestPort] = (() => {
    const match = rawHost.match(/^(.+?)(?::(\d+))?$/);
    return [match?.[1] || BASE_DOMAIN, match?.[2] || ""] as const;
  })();

  const isLocal =
    requestHostname === "localhost" ||
    requestHostname.endsWith(".localhost") ||
    requestHostname === "lvh.me" ||
    requestHostname.endsWith(".lvh.me");
  const [baseHostname, basePort = ""] = BASE_DOMAIN.split(":");

  const hostname = isLocal
    ? requestHostname.endsWith("lvh.me")
      ? "lvh.me"
      : "localhost"
    : baseHostname;
  const requestedPort = isLocal
    ? requestPort || requestUrl?.port || ""
    : basePort;
  const defaultPort = protocol === "https" ? "443" : "80";
  const port =
    requestedPort && requestedPort !== defaultPort ? `:${requestedPort}` : "";

  const url = new URL(`${protocol}://${hostname}${port}${pathname}`);
  if (search) {
    url.search = search;
  }
  return url;
}

/**
 * Extract organization slug from hostname
 * Returns null if on base domain or reserved subdomain
 */
function extractOrgSubdomain(hostname: string): string | null {
  // Remove port numbers first
  const cleanHostname = hostname.replace(/:\d+$/, "");

  // Handle localhost
  if (cleanHostname === "localhost" || cleanHostname.endsWith(".localhost")) {
    const parts = cleanHostname.split(".");
    if (
      parts.length > 1 &&
      parts[0] !== "localhost" &&
      !RESERVED_SUBDOMAINS.includes(parts[0])
    ) {
      return parts[0];
    }
    return null;
  }

  // Handle production - check if hostname ends with BASE_DOMAIN
  if (!cleanHostname.endsWith(BASE_DOMAIN)) {
    return null;
  }

  // Extract subdomain by removing base domain
  const subdomain = cleanHostname.slice(0, -(BASE_DOMAIN.length + 1)); // +1 for the dot

  // Validate subdomain exists and is not reserved
  if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
    return subdomain;
  }

  return null;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  // Prefer the original viewer host. Behind CloudFront the Host header can be
  // rewritten to the origin hostname, which makes every tenant request look
  // like a base-domain request and sends /organization to the apex.
  const hostname =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    "";

  // Extract organization subdomain
  const orgSubdomain = extractOrgSubdomain(hostname);
  const isOnSubdomain = !!orgSubdomain;
  const effectiveOrganization = isOnSubdomain
    ? orgSubdomain
    : DEFAULT_ORGANIZATION_SLUG || null;
  const isAuthenticated = !!token;

  // Classify the path
  const isAuthPath = pathname.startsWith("/auth");
  const isOrganizationsPath = pathname.startsWith("/organizations");
  const isDashboardPath = pathname.startsWith("/admin");
  const isWorkspacePath =
    pathname === "/workspace" || pathname.startsWith("/workspace/");
  const isLobbyPath = normalizedPathname === "/";
  const isInternalLobbyPath =
    normalizedPathname === "/lobby" || pathname.startsWith("/lobby/");
  const isLandingAlias =
    pathname === "/landing" || pathname.startsWith("/landing/");
  const isTenantLoginPath = normalizedPathname === "/auth/login";
  const isCommunityPath =
    pathname === "/community" || pathname.startsWith("/community/");
  const isProfilePath =
    pathname === "/profile" || pathname.startsWith("/profile/");
  const isSetupPath = pathname === "/setup" || pathname.startsWith("/setup/");
  const isOrganizationPath =
    pathname === "/organization" || pathname.startsWith("/organization/");

  // Always add X-Organization header if on subdomain
  const requestHeaders = new Headers(request.headers);
  if (effectiveOrganization) {
    requestHeaders.set("X-Organization", effectiveOrganization);
  }

  // ============================================================
  // ROUTING RULES (in order of priority)
  // ============================================================

  // RULE 0: Public marketing and account creation belong to the base domain.
  // A tenant host exposes only login; all other auth journeys run centrally.
  if (isOnSubdomain && isLandingAlias) {
    return NextResponse.redirect(getBaseDomainUrl("/", "", request));
  }
  if (isOnSubdomain && isAuthPath && !isTenantLoginPath) {
    return NextResponse.redirect(
      getBaseDomainUrl(pathname, request.nextUrl.search, request),
    );
  }

  // RULE 0b: Keep the public homepage on the base domain and serve the
  // protected workspace lobby at the tenant root without exposing /lobby.
  if (isLobbyPath && isOnSubdomain && isAuthenticated) {
    const lobbyUrl = new URL("/lobby", request.url);
    return NextResponse.rewrite(lobbyUrl, {
      request: { headers: requestHeaders },
    });
  }
  if (isInternalLobbyPath) {
    return NextResponse.redirect(
      isOnSubdomain
        ? new URL("/", request.url)
        : getBaseDomainUrl("/", "", request),
    );
  }

  // RULE 1: On BASE DOMAIN - block dashboard routes entirely
  // Dashboard and organization routes require tenant context from a subdomain.
  if (
    !isOnSubdomain &&
    (isDashboardPath ||
      isWorkspacePath ||
      isCommunityPath ||
      isSetupPath ||
      isOrganizationPath ||
      isProfilePath)
  ) {
    if (isAuthenticated) {
      return NextResponse.redirect(
        getBaseDomainUrl("/organizations", "", request),
      );
    } else {
      const loginUrl = getBaseDomainUrl("/auth/login", "", request);
      loginUrl.searchParams.set("redirect_to", "/organizations");
      return NextResponse.redirect(loginUrl);
    }
  }

  // RULE 2: On SUBDOMAIN - redirect /organizations to base domain
  // Organizations list is only available on base domain
  if (isOnSubdomain && isOrganizationsPath) {
    return NextResponse.redirect(
      getBaseDomainUrl("/organizations", "", request),
    );
  }

  // RULE 3: Authenticated users should not access auth pages (except verify-email handled above)
  if (isAuthenticated && isAuthPath) {
    const destinationUrl = isOnSubdomain
      ? new URL("/", request.url)
      : getBaseDomainUrl("/organizations", "", request);
    return NextResponse.redirect(destinationUrl);
  }

  // RULE 4: Protected paths on subdomain require authentication
  if (
    isOnSubdomain &&
    !isAuthenticated &&
    (isDashboardPath ||
      isWorkspacePath ||
      isLobbyPath ||
      isSetupPath ||
      isOrganizationPath ||
      isProfilePath ||
      isCommunityPath)
  ) {
    const loginUrl = isOnSubdomain
      ? new URL("/auth/login", request.url)
      : getBaseDomainUrl("/auth/login", "", request);
    loginUrl.searchParams.set(
      "redirect_to",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  // All checks passed - continue with the request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Run middleware for these routes
export const config = {
  matcher: [
    "/",
    "/landing/:path*",
    "/lobby/:path*",
    "/admin",
    "/admin/:path*",
    "/workspace/:path*",
    "/community/:path*",
    "/profile",
    "/profile/:path*",
    "/setup",
    "/setup/:path*",
    "/organization",
    "/organization/:path*",
    "/auth/:path*",
    "/organizations",
    "/organizations/:path*",
  ],
};
