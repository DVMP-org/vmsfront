import { NextResponse, type NextRequest } from 'next/server';
import { RESERVED_SUBDOMAINS } from '@/lib/subdomain-utils';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "vmsfront.to";
const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const DEFAULT_ORGANIZATION_SLUG = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG || "";

/**
 * Construct a URL on the base domain (without subdomain)
 */
function getBaseDomainUrl(pathname: string = '/', search: string = ''): URL {
  const url = new URL(`${PROTOCOL}://${BASE_DOMAIN}${pathname}`);
  if (search) {
    url.search = search;
  }
  return url;
}

/**
 * Construct a URL on an org subdomain.
 * Uses the same `host` header + manual port-strip pattern as extractOrgSubdomain
 * so hostname detection is consistent throughout the middleware.
 */
function buildSubdomainUrl(slug: string, pathname: string, search: string, request: NextRequest): URL {
  const hostname = request.headers.get("host") || "";
  const cleanHostname = hostname.replace(/:\d+$/, "");
  const port = hostname.match(/:\d+$/)?.[0] ?? "";

  const isLocalhost = cleanHostname === "localhost" || cleanHostname.endsWith(".localhost");

  const host = isLocalhost
    ? `${slug}.localhost${port}`
    : `${slug}.${BASE_DOMAIN}`;

  const url = new URL(`${PROTOCOL}://${host}${pathname}`);
  if (search) url.search = search;
  return url;
}


function extractOrgSubdomain(hostname: string): string | null {
  // Remove port numbers first
  const cleanHostname = hostname.replace(/:\d+$/, "");

  // Handle localhost
  if (cleanHostname === "localhost" || cleanHostname.endsWith(".localhost")) {
    const parts = cleanHostname.split(".");
    if (parts.length > 1 && parts[0] !== "localhost" && !RESERVED_SUBDOMAINS.includes(parts[0])) {
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
  const token = request.cookies.get('auth-token')?.value;
  const selectedOrganization = request.cookies.get('selected-organization')?.value || DEFAULT_ORGANIZATION_SLUG;
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Extract organization subdomain
  const orgSubdomain = extractOrgSubdomain(hostname);
  const effectiveOrganization = orgSubdomain || selectedOrganization || null;
  const isOnSubdomain = !!orgSubdomain;
  const isAuthenticated = !!token;

  // Classify the path
  const isAuthPath = pathname.startsWith('/auth');
  const isVerifyEmailPath = pathname.startsWith('/auth/verify-email');
  const isLoginPath = pathname.startsWith('/auth/login');
  const isOrganizationsPath = pathname.startsWith('/organizations');
  const isDashboardPath = pathname.startsWith('/admin') || pathname.startsWith('/residency');
  const isSelectPath = pathname.startsWith('/select');
  const isUserSettingsPath = pathname.startsWith('/user');

  // Always add X-Organization header if on subdomain
  const requestHeaders = new Headers(request.headers);
  if (effectiveOrganization) {
    requestHeaders.set("X-Organization", effectiveOrganization);
  }

  // ============================================================
  // ROUTING RULES (in order of priority)
  // ============================================================

  // RULE -1: organization_slug redirect
  // When a backend-generated email link contains ?organization_slug=<slug>, redirect
  // the user straight to the correct org subdomain (stripping the param).
  // We skip auth paths because those always live on the root domain.
  const myOrgSlug = request.nextUrl.searchParams.get('organization_slug');
  if (myOrgSlug && !isAuthPath && !RESERVED_SUBDOMAINS.includes(myOrgSlug) && /^[a-z0-9-]+$/.test(myOrgSlug)) {
    const cleanSearch = new URLSearchParams(request.nextUrl.search);
    cleanSearch.delete('organization_slug');
    const redirectUrl = buildSubdomainUrl(
      myOrgSlug,
      pathname,
      cleanSearch.toString() ? `?${cleanSearch.toString()}` : '',
      request,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // RULE 0: Always allow verify-email - users must be able to verify regardless of context
  if (isVerifyEmailPath) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // RULE 0.5: On SUBDOMAIN - redirect auth pages to base domain
  // Login is allowed on subdomains (so users can sign in within org context).
  // Register and all other auth pages must live on the root domain.
  if (isOnSubdomain && isAuthPath && !isLoginPath) {
    const baseDomainUrl = getBaseDomainUrl(pathname, request.nextUrl.search);
    return NextResponse.redirect(baseDomainUrl);
  }

  // RULE 1: On BASE DOMAIN - block dashboard routes entirely
  // Dashboard routes (/admin, /residency, /select) require org context from subdomain
  if (!isOnSubdomain && !effectiveOrganization && (isDashboardPath || isSelectPath)) {
    if (isAuthenticated) {
      return NextResponse.redirect(getBaseDomainUrl('/organizations'));
    } else {
      const loginUrl = getBaseDomainUrl('/auth/login');
      loginUrl.searchParams.set('redirect_to', '/organizations');
      return NextResponse.redirect(loginUrl);
    }
  }

  // RULE 2: On SUBDOMAIN - redirect /organizations to base domain
  // Organizations list is only available on base domain
  if (isOnSubdomain && isOrganizationsPath) {
    return NextResponse.redirect(getBaseDomainUrl('/organizations'));
  }

  // RULE 2.5: On SUBDOMAIN - redirect landing pages to base domain
  // Landing/marketing pages should only be accessible from the base domain
  const isLandingPage = pathname === '/';
  if (isOnSubdomain && isLandingPage) {
    return NextResponse.redirect(getBaseDomainUrl('/'));
  }

  // RULE 3: Authenticated users should not access auth pages (except verify-email handled above)
  if (isAuthenticated && isAuthPath) {
    const redirectTo = effectiveOrganization ? '/select' : '/organizations';
    const destinationUrl = isOnSubdomain
      ? new URL(redirectTo, request.url)
      : getBaseDomainUrl(redirectTo);
    return NextResponse.redirect(destinationUrl);
  }

  // RULE 4: Protected paths require authentication
  if (!isAuthenticated && (isDashboardPath || isSelectPath || isUserSettingsPath)) {
    const loginUrl = getBaseDomainUrl('/auth/login');
    if (orgSubdomain) {
      // Embed the org slug in the redirect target so RULE -1 restores subdomain
      // context after a successful login (e.g. redirect_to=/admin?organization_slug=acme)
      const redirectSearch = new URLSearchParams({ organization_slug: orgSubdomain });
      loginUrl.searchParams.set('redirect_to', `${pathname}?${redirectSearch.toString()}`);
    } else {
      loginUrl.searchParams.set('redirect_to', pathname);
    }
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
    '/',
    '/admin',
    '/admin/:path*',
    '/residency',
    '/residency/:path*',
    '/resident',
    '/resident/:path*',
    '/select',
    '/gate',
    '/gate/:path*',
    '/auth/:path*',
    '/visit/:path*',
    '/organizations',
    '/organizations/:path*',
    '/user',
    '/user/:path*',
  ],
};
