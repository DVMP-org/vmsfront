import { NextResponse, type NextRequest } from 'next/server';
import { RESERVED_SUBDOMAINS } from '@/lib/subdomain-utils';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "vmsfront.to";

/**
 * Extract organization slug from hostname
 * Returns null if on base domain or reserved subdomain
 */
function extractOrgSubdomain(hostname: string): string | null {
  const cleanHostname = hostname.replace(":3000", "").replace(":443", "");

  // Handle localhost
  if (cleanHostname.includes("localhost")) {
    const parts = cleanHostname.split(".");
    if (parts.length > 1 && parts[0] !== "localhost" && !RESERVED_SUBDOMAINS.includes(parts[0])) {
      return parts[0];
    }
    return null;
  }

  // Handle production
  const parts = cleanHostname.replace(BASE_DOMAIN, "").split(".").filter(Boolean);
  if (parts.length > 0 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
    return parts[0];
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
  const isAuthenticated = !!token;

  // Classify the path
  const isAuthPath = pathname.startsWith('/auth');
  const isVerifyEmailPath = pathname === '/auth/verify-email';
  const isOrganizationsPath = pathname.startsWith('/organizations');
  const isDashboardPath = pathname.startsWith('/admin') || pathname.startsWith('/residency');
  const isSelectPath = pathname.startsWith('/select');

  // Always add X-Organization header if on subdomain
  const requestHeaders = new Headers(request.headers);
  if (orgSubdomain) {
    requestHeaders.set("X-Organization", orgSubdomain);
  }

  // ============================================================
  // ROUTING RULES
  // ============================================================

  // RULE 1: Authenticated users should not access auth pages (except verify-email)
  if (isAuthenticated && isAuthPath && !isVerifyEmailPath) {
    const redirectTo = isOnSubdomain ? '/select' : '/organizations';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // RULE 2: On SUBDOMAIN - /organizations should redirect to /select
  // (Organizations list is only for base domain to choose which org to enter)
  if (isOnSubdomain && isOrganizationsPath) {
    return NextResponse.redirect(new URL('/select', request.url));
  }

  // RULE 3: On BASE DOMAIN - dashboard routes (/admin, /residency, /select) should redirect to /organizations
  // (Dashboard routes require an org context from subdomain)
  if (!isOnSubdomain && (isDashboardPath || isSelectPath)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/organizations', request.url));
    } else {
      // Not authenticated - send to login with redirect back
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect_to', '/organizations');
      return NextResponse.redirect(loginUrl);
    }
  }

  // RULE 4: Protected paths require authentication
  // (Dashboard paths on subdomain need auth)
  if (!isAuthenticated && (isDashboardPath || isSelectPath)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
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
    '/residency',
    '/residency/:path*',
    '/select',
    '/auth/:path*',
    '/visit/:path*',
    '/organizations',
    '/organizations/:path*'
  ],
};
