import { NextResponse, type NextRequest } from 'next/server';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "vmsfront.to";
const RESERVED_SUBDOMAINS = ["www", "app", "api", "admin", "visit"];

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

  // Define path types
  const isAuthPath = pathname.startsWith('/auth');
  const isOrganizationsPath = pathname.startsWith('/organizations');
  const isDashboardPath = pathname.startsWith('/admin') || pathname.startsWith('/residency');
  const isSelectPath = pathname.startsWith('/select');
  const isProtectedPath = isDashboardPath || isSelectPath || isOrganizationsPath;

  // Add X-Organization-Slug header for API requests if on subdomain
  const requestHeaders = new Headers(request.headers);
  if (orgSubdomain) {
    requestHeaders.set("X-Organization", orgSubdomain);
  }

  // 1. If user is authenticated and tries to access /auth paths (except verify-email)
  if (token && isAuthPath && !pathname.includes('verify-email')) {
    // Redirect based on context
    if (isOnSubdomain) {
      return NextResponse.redirect(new URL('/select', request.url));
    } else {
      return NextResponse.redirect(new URL('/organizations', request.url));
    }
  }

  // 2. If on subdomain and trying to access /organizations, redirect to /select
  if (isOnSubdomain && isOrganizationsPath && token) {
    return NextResponse.redirect(new URL('/select', request.url));
  }

  // 3. If user is NOT authenticated and tries to access protected paths
  if (!token && isProtectedPath) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. If on BASE domain and trying to access dashboard routes (/admin, /residency), redirect to organizations
  // Dashboard routes are only accessible from org subdomains
  if (!isOnSubdomain && isDashboardPath && token) {
    return NextResponse.redirect(new URL('/organizations', request.url));
  }

  // 5. If on BASE domain and trying to access /select, redirect to /organizations
  if (!isOnSubdomain && isSelectPath && token) {
    return NextResponse.redirect(new URL('/organizations', request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Optimization: Only run middleware for specific routes
export const config = {
  matcher: ['/admin/:path*', '/residency/:path*', '/select', '/auth/:path*', '/visit/:path*', '/organizations/:path*'],
};
