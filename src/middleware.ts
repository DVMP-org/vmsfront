import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host")?.replace(":3000", "")
  ?.replace(":443", "") || "";

  // Handle subdomain routing for visit module
  const subdomain = hostname.split(".")[0];
  const visitSubdomain = process.env.NEXT_PUBLIC_VISIT_SUBDOMAIN || "visit";
  if (subdomain === visitSubdomain && pathname !== "/visit") {
    return NextResponse.rewrite(new URL("/visit", request.url));
  }
  // Define public vs private paths
  const isAuthPath = pathname.startsWith('/auth');
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/residency') ||
    pathname.startsWith('/select');

  // 1. If user is authenticated and tries to access /auth/login, redirect to /select
  if (token && isAuthPath && !pathname.includes('verify-email')) {
    return NextResponse.redirect(new URL('/select', request.url));
  }

  // 2. If user is NOT authenticated and tries to access protected paths, redirect to /auth/login
  if (!token && isProtectedPath) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Optimization: Only run middleware for specific routes
export const config = {
  matcher: ['/admin/:path*', '/residency/:path*', '/select', '/auth/:path*', '/visit/:path*'],
};
