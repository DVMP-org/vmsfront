"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { useCurrentSubscription } from "@/hooks/use-subscription";
import { SubscriptionStatus } from "@/types/subscription";
import { motion } from "framer-motion";
import { Loader2, Crown } from "lucide-react";

interface SubscriptionGuardProps {
    children: React.ReactNode;
    /**
     * If true, redirects to plans page when no active subscription
     * If false, just renders children (useful for showing subscription status)
     */
    requireActive?: boolean;
    /**
     * Custom redirect URL (defaults to /organizations/plans)
     */
    redirectTo?: string;
}

export function SubscriptionGuard({
    children,
    requireActive = true,
    redirectTo = "/plans",
}: SubscriptionGuardProps) {
    const router = useRouter();
    const { organization, isLoading: orgLoading } = useCurrentOrganization();
    const { data: subscription, isLoading: subLoading, isError: isSubError } = useCurrentSubscription();

    const isLoading = orgLoading || subLoading;

    const hasActiveSubscription =
        subscription &&
        (subscription.status === SubscriptionStatus.ACTIVE ||
            subscription.status === SubscriptionStatus.PAST_DUE);
    const shouldEnforceSubscription =
        requireActive &&
        process.env.NEXT_PUBLIC_ENFORCE_SUBSCRIPTIONS === "true";

    useEffect(() => {
        if (!isLoading && shouldEnforceSubscription && !hasActiveSubscription) {
            router.push(redirectTo);
        }
    }, [
        isLoading,
        shouldEnforceSubscription,
        hasActiveSubscription,
        redirectTo,
        router,
    ]);

    useEffect(() => {
        if (isSubError && shouldEnforceSubscription) {
            router.push('/plans');
        }
    }, [isSubError, shouldEnforceSubscription, router]);

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">

            </div>
        );
    }

    if (shouldEnforceSubscription && !hasActiveSubscription) {
        // Will redirect, show loading in the meantime
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--vms-action)] motion-reduce:animate-none" />
                    <p className="text-sm text-zinc-500">Redirecting to plans...</p>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
