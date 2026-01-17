"use client";

import { useAuth } from "@/hooks/use-auth";
import { useResendVerification } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft, ShieldCheck, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { motion } from "framer-motion";

export default function VerifyEmailPage() {
    const { user, logout } = useAuth();
    const resendMutation = useResendVerification();
    const [countdown, setCountdown] = useState(0);

    const handleResend = async () => {
        if (countdown > 0) return;

        resendMutation.mutate(undefined, {
            onSuccess: () => {
                setCountdown(60);
                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        });
    };

    return (
        <AuthLayout
            title="Check your inbox"
            description={`We've sent a magic link to ${user?.email || 'your email'}`}
        >
            <div className="space-y-8">
                {/* Visual Cue */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                            <Mail className="w-10 h-10 text-[var(--brand-primary)]" />
                        </div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-[var(--brand-primary)] text-white p-1.5 rounded-full shadow-lg"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                        </motion.div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="flex items-start gap-4 p-5 bg-primary/[0.03] rounded-2xl border border-primary/10">
                    <div className="flex-shrink-0 w-12 h-12 bg-background rounded-xl flex items-center justify-center shadow-sm border border-border">
                        <ShieldCheck className="w-6 h-6 text-[var(--brand-primary)]" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold">Secure Access</h3>
                        <p className="text-xs text-muted-foreground leading-normal">
                            Verifying your email confirms your identity and keeps your property data safe.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={handleResend}
                        isLoading={resendMutation.isPending}
                        disabled={countdown > 0}
                        className={cn(
                            "w-full h-12 text-base font-semibold shadow-lg shadow-primary/20",
                            countdown > 0 && "opacity-80"
                        )}
                    >
                        {countdown > 0 ? (
                            <span className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Request again in {countdown}s
                            </span>
                        ) : (
                            "Resend verification link"
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => {
                            window.location.href = "/select";
                        }}
                        className="w-full h-12 text-base font-semibold border-border hover:bg-accent transition-colors group"
                    >
                        Continue to Dashboard
                        <ExternalLink className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Button>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                    <button
                        onClick={() => logout()}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[var(--brand-primary)] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Account logout
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                        Need assistance? <Link href="/support" className="text-[var(--brand-primary)] hover:underline font-medium">Contact support</Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
