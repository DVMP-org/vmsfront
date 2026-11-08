import { NextResponse, type NextRequest } from 'next/server';
import { RESERVED_SUBDOMAINS } from '@/lib/subdomain-utils';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "vmsfront.to";
const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const DEFAULT_ORGANIZATION_SLUG = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG || "";

/**
 * Construct a URL on the base domain (without subdomain)
 */
function getBaseDomainUrl(
  pathname: string = '/',
  search: string = '',
  request?: NextRequest
): URL {
  const forwardedProtocol = request?.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    .trim();
  const protocol =
    forwardedProtocol ||
    (request ? new URL(request.url).protocol.replace(':', '') : PROTOCOL);
  const url = new URL(`${protocol}://${BASE_DOMAIN}${pathname}`);
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
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Extract organization subdomain
  const orgSubdomain = extractOrgSubdomain(hostname);
  const isOnSubdomain = !!orgSubdomain;
  const effectiveOrganization = isOnSubdomain
    ? orgSubdomain
    : DEFAULT_ORGANIZATION_SLUG || null;
  const isAuthenticated = !!token;

  // Classify the path
  const isAuthPath = pathname.startsWith('/auth');
  const isVerifyEmailPath = pathname.startsWith('/auth/verify-email');
  const isOrganizationsPath = pathname.startsWith('/organizations');
  const isDashboardPath = pathname.startsWith('/admin') || pathname.startsWith('/residency');
  const isSelectPath = pathname.startsWith('/select');
  const isOrganizationPath = pathname.startsWith('/organization');

  // Always add X-Organization header if on subdomain
  const requestHeaders = new Headers(request.headers);
  if (effectiveOrganization) {
    requestHeaders.set("X-Organization", effectiveOrganization);
  }

  // ============================================================
  // ROUTING RULES (in order of priority)
  // ============================================================

  // RULE 0: Always allow verify-email - users must be able to verify regardless of context
  if (isVerifyEmailPath) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // RULE 1: On BASE DOMAIN - block dashboard routes entirely
  // Dashboard routes (/admin, /residency, /select) require org context from subdomain
  if (!isOnSubdomain && (isDashboardPath || isSelectPath || isOrganizationPath)) {
    if (isAuthenticated) {
      return NextResponse.redirect(getBaseDomainUrl('/organizations', '', request));
    } else {
      const loginUrl = getBaseDomainUrl('/auth/login', '', request);
      loginUrl.searchParams.set('redirect_to', '/organizations');
      return NextResponse.redirect(loginUrl);
    }
  }

  // RULE 2: On SUBDOMAIN - redirect /organizations to base domain
  // Organizations list is only available on base domain
  if (isOnSubdomain && isOrganizationsPath) {
    return NextResponse.redirect(getBaseDomainUrl('/organizations', '', request));
  }

  // RULE 3: Authenticated users should not access auth pages (except verify-email handled above)
  if (isAuthenticated && isAuthPath) {
    const destinationUrl = isOnSubdomain
      ? new URL('/organization', request.url)
      : getBaseDomainUrl('/organizations', '', request);
    return NextResponse.redirect(destinationUrl);
  }

  // RULE 4: Protected paths on subdomain require authentication
  if (!isAuthenticated && (isDashboardPath || isSelectPath || isOrganizationPath)) {
    const loginUrl = isOnSubdomain
      ? new URL('/auth/login', request.url)
      : getBaseDomainUrl('/auth/login', '', request);
    loginUrl.searchParams.set(
      'redirect_to',
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
    '/admin',
    '/admin/:path*',
    '/select',
    '/organization',
    '/organization/:path*',
    '/auth/:path*',
    '/organizations',
    '/organizations/:path*'
  ],
};
