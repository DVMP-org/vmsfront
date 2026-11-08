"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Loader } from "@/components/ui/loader";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, token, _hasHydrated } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    const authCheck = () => {
      if (!isAuthenticated || !token) {
        // Middleware usually handles this, but we keep this as a safety layer
        if (!pathname?.startsWith("/auth")) {
          const loginUrl = new URL("/auth/login", window.location.origin);
          loginUrl.searchParams.set("redirect_to", pathname || "/");
          router.replace(loginUrl.pathname + loginUrl.search);
          // Don't set authorized - keep showing loading spinner during redirect
          return;
        }
      }
      setAuthorized(true);
      setLoading(false);
    };

    authCheck();
  }, [isAuthenticated, token, user, pathname, router, _hasHydrated]);

  if (loading || !authorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--vms-canvas)]">
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
              <Loader size={32} colour="brand-primary" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink)]">
              Verifying session
            </p>
            <p className="text-xs font-medium text-[var(--vms-ink-muted)]">
              Please wait while we secure your connection...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
