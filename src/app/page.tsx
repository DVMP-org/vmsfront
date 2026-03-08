"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getSubdomain } from "@/lib/subdomain-utils";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, token, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (isAuthenticated || !!token) {
      const subdomain = getSubdomain();
      // On subdomain, go to select; on root domain, go to organizations
      router.replace(subdomain ? "/select" : "/organizations");
    } else {
      router.replace("/auth/login");
    }
  }, [_hasHydrated, isAuthenticated, token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

