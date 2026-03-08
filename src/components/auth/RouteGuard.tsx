"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Loader } from "@/components/ui/loader";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const { isAuthenticated, token, _hasHydrated } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    // Auth pages are always allowed (middleware handles subdomain redirect)
    const isAuthPath = pathname?.startsWith("/auth");
    if (isAuthPath) {
      setAuthorized(true);
      setLoading(false);
      return;
    }

    // For protected routes, check client-side auth state
    // Middleware handles cookie-based auth, but localStorage auth needs client-side check
    if (isAuthenticated || token) {
      setAuthorized(true);
      setLoading(false);
    } else {
      // Not authenticated - middleware should have redirected, but show loading while it processes
      setLoading(true);
    }
  }, [isAuthenticated, token, pathname, _hasHydrated]);

  if (loading || !authorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-background relative overflow-hidden">
        {/* Ambient background effect */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[rgb(var(--brand-primary,#213928)/0.05)] blur-[120px] rounded-full animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[rgb(var(--brand-primary,#213928)/0.5)] blur-[120px] rounded-full animate-pulse-slow delay-700" />
        </div>

        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-xl">
              <Loader size={32} colour="brand-primary" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
              Verifying session
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Please wait while we secure your connection...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
