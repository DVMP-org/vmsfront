"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, token, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    if ((!isAuthenticated || !token) && !pathname?.startsWith("/auth")) {
      const loginUrl = new URL("/auth/login", window.location.origin);
      loginUrl.searchParams.set("redirect_to", pathname || "/");
      router.replace(loginUrl.pathname + loginUrl.search);
    }
  }, [isAuthenticated, token, user, pathname, router, _hasHydrated]);

  // Middleware is the authoritative server-side gate. Rendering immediately
  // avoids a full-page hydration interstitial before organization membership
  // can begin loading.
  return <>{children}</>;
}
