"use client";

import { useAuth } from "@/hooks/use-auth";
import { useResendVerification } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

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
        <div className="min-h-screen  flex flex-col relative overflow-hidden">
            {/* Ambient Background Elements */}

            <Header type="auth" />

            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
                <div className="max-w-[480px] w-full space-y-8">

                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex relative">
                            <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 ">
                                <Mail className="w-8 h-8 text-[var(--brand-primary)]" />
                                <div className="absolute -top-2 -right-2 bg-[var(--brand-primary)] text-white p-1.5 rounded-full shadow-lg">
                                    <Sparkles className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Check your inbox
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-[360px] mx-auto">
                                We've sent a magic link to <span className="text-gray-900 dark:text-gray-100 font-medium">{user?.email}</span>
                            </p>
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-sm p-8 sm:p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] space-y-8 relative overflow-hidden group">

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-5 bg-primary/[0.03] dark:bg-primary/[0.05] rounded-3xl border border-primary/10">
                                <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
                                    <ShieldCheck className="w-6 h-6 text-[var(--brand-primary)]" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Secure Access</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">Verifying your email confirms your identity and keeps your property data safe.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleResend}
                                    isLoading={resendMutation.isPending}
                                    disabled={countdown > 0}
                                    className={cn(
                                        "w-full h-14 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg shadow-primary/20",
                                        "hover:translate-y-[-2px] hover:shadow-primary/30 active:translate-y-[0px]",
                                        countdown > 0 && "opacity-80"
                                    )}
                                >
                                    {countdown > 0 ? (
                                        <span className="flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin-slow" />
                                            Request again in {countdown}s
                                        </span>
                                    ) : (
                                        "Resend verification link"
                                    )}
                                </Button>

                                <p className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium pt-1">
                                    Didn't get the email? Try checking your junk or spam folder.
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest text-gray-300 dark:text-gray-600">
                                <span className="bg-transparent px-6 backdrop-blur-sm">Already done?</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    window.location.href = "/select";
                                }}
                                className="h-13 rounded-2xl border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group/btn"
                            >
                                Continue to Dashboard
                                <ExternalLink className="w-4 h-4 ml-2 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                            </Button>

                            <div className="flex items-center justify-center pt-2">
                                <button
                                    onClick={() => logout()}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary transition-all duration-200 px-4 py-2 rounded-xl border border-transparent hover:bg-primary/5 hover:border-primary/10"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Account logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Help */}
                    <div className="text-center motion-safe:animate-pulse-slow">
                        <p className="text-sm text-gray-400 dark:text-gray-600">
                            Need assistance? <Link href="/support" className="text-primary hover:underline font-medium">Contact our support team</Link>
                        </p>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}
