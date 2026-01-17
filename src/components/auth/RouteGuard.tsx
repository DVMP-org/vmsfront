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
    const { isAuthenticated, user, token } = useAuthStore();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Small delay to allow Zustand to hydrate from localStorage
        const authCheck = () => {
            if (!isAuthenticated || !token) {
                // Check if we are on an auth page, if not redirect
                if (!pathname.startsWith("/auth")) {
                    const loginUrl = new URL("/auth/login", window.location.origin);
                    loginUrl.searchParams.set("redirect_to", pathname);
                    router.replace(loginUrl.pathname + loginUrl.search);
                }

            }
            setAuthorized(true);
            setLoading(false);
        };

        // We use a small timeout to ensure Zustand persist has had a chance to run
        // though usually it's synchronous on the client.
        const timer = setTimeout(() => {
            authCheck();
        }, 100);



        return () => clearTimeout(timer);
    }, [isAuthenticated, token, user, pathname, router]);

    if (loading || !authorized) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader size={40} colour="secondary" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">
                        Verifying session...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
