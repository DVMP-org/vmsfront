"use client";

import { useAuth, useProfile } from "@/hooks/use-auth";
import { useResendVerification } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft, ShieldCheck, ExternalLink, RefreshCw, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyEmailPage() {
    const { user, logout } = useAuth();
    const { refetch: refreshProfile } = useProfile();
    const resendMutation = useResendVerification();
    const [countdown, setCountdown] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-[#020617]">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[rgb(var(--brand-primary,#213928))]/5 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse-slow delay-700" />
            </div>

            <Header type="auth" />

            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-[480px] w-full space-y-8"
                >
                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex relative">
                            <motion.div
                                initial={{ scale: 0.8, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none"
                            >
                                <Mail className="w-10 h-10 text-[rgb(var(--brand-primary,#213928))]" />
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 10, -10, 0]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute -top-2 -right-2 bg-[rgb(var(--brand-primary,#213928))] text-white p-2 rounded-full shadow-lg"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.div>
                            </motion.div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Check your inbox
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[360px] mx-auto">
                                We've sent a magic link to <span className="text-slate-900 dark:text-white font-bold">{user?.email}</span>
                            </p>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="flex items-start gap-4 p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                        <div className="flex-shrink-0 w-12 h-12 bg-[rgb(var(--brand-primary,#213928))]/10 rounded-2xl flex items-center justify-center border border-[rgb(var(--brand-primary,#213928))]/20">
                            <ShieldCheck className="w-6 h-6 text-[rgb(var(--brand-primary,#213928))]" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Secure Access</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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
                                "w-full h-14 text-base font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]",
                                countdown > 0
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-none"
                                    : "bg-[rgb(var(--brand-primary,#213928))] text-white hover:bg-[rgb(var(--brand-primary,#213928))]/90"
                            )}
                        >
                            {countdown > 0 ? (
                                <span className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Resend in {countdown}s
                                </span>
                            ) : (
                                "Resend verification link"
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            isLoading={isRefreshing}
                            onClick={async () => {
                                setIsRefreshing(true);
                                try {
                                    await refreshProfile();
                                    window.location.href = "/select";
                                } catch (error) {
                                    console.error("Failed to refresh profile:", error);
                                    window.location.href = "/select";
                                } finally {
                                    setIsRefreshing(false);
                                }
                            }}
                            className="w-full h-14 text-base font-bold rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] group"
                        >
                            Continue to Dashboard
                            <ExternalLink className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </div>

                    <div className="flex flex-col items-center gap-6 pt-4">
                        <button
                            onClick={() => logout()}
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[rgb(var(--brand-primary,#213928))] dark:text-slate-500 dark:hover:text-white transition-all px-4 py-2 rounded-xl hover:bg-[rgb(var(--brand-primary,#213928))]/5"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Account logout
                        </button>

                        <div className="text-center space-y-1">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Need assistance?
                            </p>
                            <Link
                                href="/support"
                                className="text-sm text-[rgb(var(--brand-primary,#213928))] dark:text-white hover:underline font-bold"
                            >
                                Contact our support team
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
