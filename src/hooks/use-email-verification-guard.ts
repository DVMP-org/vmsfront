"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

/**
 * Redirects users to the email verification page if their email is not verified.
 */
export function useRequireEmailVerification(enabled: boolean = true) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuthStore();


    useEffect(() => {
        if (!enabled || !isAuthenticated || !user) return;

        const isEmailVerified = !!user.email_verified_at;
        const isVerificationPage = pathname?.startsWith("/auth/verify-email");
        const isAuthPage = pathname?.startsWith("/auth/");
        const isPublicPage = pathname === "/" || pathname === "/about" || pathname === "/contact";

        // Don't redirect if already on verification or any auth page (login, register, forgot-password, etc.)
        // if (!isEmailVerified && !isVerificationPage && !isAuthPage && !isPublicPage) {
        //     router.replace("/auth/verify-email");
        // }

        // // If verified and on verification page, redirect to home or select
        // if (isEmailVerified && isVerificationPage) {
        //     router.replace("/select");
        // }
    }, [enabled, isAuthenticated, user, pathname, router]);
}
