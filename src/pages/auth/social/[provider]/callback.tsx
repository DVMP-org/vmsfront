
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSocialCallback } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { titleCase } from "@/lib/utils";

export default function SocialCallbackPage() {
    const router = useRouter();
    const { provider, code } = router.query;
    const { mutate: handleCallback, isPending, isError } = useSocialCallback();
    const hasTriggered = useRef(false);

    useEffect(() => {
        if (provider && code && !hasTriggered.current) {
            hasTriggered.current = true;
            handleCallback({ provider: provider as string, code: code as string });
        } else if (!code && !isPending) {
            router.replace("/auth/login");
        }
    }, [provider, code, handleCallback, router, isPending]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-card p-8 rounded-2xl border border-border shadow-xl text-center space-y-6"
            >
                <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                </div>

                <h1 className="text-2xl font-bold tracking-tight">
                    Authenticating...
                </h1>

                <p className="text-muted-foreground">
                    Please wait while we complete your sign-in with {titleCase(provider)}.
                </p>

                {isError && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-destructive text-sm font-medium"
                    >
                        Something went wrong. Redirecting you back...
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
}