"use client";

import { useAuth, useProfile, useVerifyEmail } from "@/hooks/use-auth";
import { useResendVerification } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { motion, AnimatePresence } from "framer-motion";
import { Loader } from "@/components/ui/loader";

export default function VerifyEmailPage() {
  const { user, logout } = useAuth();
  const { refetch: refreshProfile } = useProfile();
  const resendMutation = useResendVerification();
  const verifyMutation = useVerifyEmail();
  const searchParams = useSearchParams();
  const tokenFromParams = searchParams?.get("token");
  const [countdown, setCountdown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (tokenFromParams && !verificationAttempted.current) {
      verificationAttempted.current = true;
      verifyMutation.mutate(
        { token: tokenFromParams },
        {
          onSuccess: () => {
            refreshProfile();
          },
        },
      );
    }
  }, [tokenFromParams, verifyMutation, refreshProfile]);

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
      },
    });
  };
  return (
    <div className="flex min-h-screen flex-col bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <AnimatePresence mode="wait">
        {verifyMutation.isPending && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--vms-canvas)]/95"
          >
            <div className="relative">
              <div className="relative rounded-[var(--vms-radius-overlay)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-8 shadow-[var(--vms-shadow-overlay)]">
                <Loader
                  size={48}
                  colour="brand-primary"
                  className="animate-spin"
                />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-center space-y-2"
            >
              <h2 className="text-xl font-semibold text-[var(--vms-ink)]">
                Verifying your email
              </h2>
              <p className="text-sm text-[var(--vms-ink-muted)]">
                Please wait a moment while we secure your account...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                className="relative rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-6"
              >
                <Mail className="h-10 w-10 text-[var(--vms-action)]" />
                {verifyMutation.isError ? (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                ) : (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -right-2 -top-2 rounded-full bg-[var(--vms-action)] p-2 text-[var(--vms-on-action)]"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--vms-ink)]">
                {verifyMutation.isPending
                  ? "Verifying your email..."
                  : verifyMutation.isSuccess
                    ? "Email verified!"
                    : verifyMutation.isError
                      ? "Verification failed"
                      : "Check your inbox"}
              </h1>
              <p className="mx-auto max-w-[360px] text-sm leading-relaxed text-[var(--vms-ink-muted)]">
                {verifyMutation.isPending ? (
                  "Please wait while we confirm your email address."
                ) : verifyMutation.isSuccess ? (
                  "Your email has been successfully verified. You can now continue to the dashboard."
                ) : verifyMutation.isError ? (
                  "The verification link may be invalid or expired. Please try resending the link."
                ) : (
                  <>
                    We've sent a magic link to{" "}
                    <span className="font-semibold text-[var(--vms-ink)]">
                      {user?.email}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="flex items-start gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]">
              <ShieldCheck className="h-6 w-6 text-[var(--vms-action)]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--vms-ink)]">
                Secure Access
              </h3>
              <p className="text-xs leading-relaxed text-[var(--vms-ink-muted)]">
                Verifying your email confirms your identity and keeps your
                property data safe.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleResend}
              isLoading={resendMutation.isPending}
              disabled={
                countdown > 0 ||
                verifyMutation.isPending ||
                verifyMutation.isSuccess
              }
              className={cn(
                "w-full h-14 text-base font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]",
                countdown > 0 || verifyMutation.isSuccess
                  ? "border-none bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]"
                  : "bg-[var(--vms-action)] text-[var(--vms-on-action)] hover:bg-[var(--vms-action-hover)]",
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
              className="group h-12 w-full rounded-[var(--vms-radius-control)] text-base font-semibold"
            >
              Continue to Dashboard
              <ExternalLink className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-6 pt-4">
            <button
              onClick={() => logout()}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--vms-radius-control)] px-4 py-2 text-sm font-semibold text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]"
            >
              <ArrowLeft className="w-4 h-4" />
              Account logout
            </button>

            <div className="text-center space-y-1">
              <p className="text-xs text-[var(--vms-ink-muted)]">
                Need assistance?
              </p>
              <Link
                href="/support"
                className="text-sm font-semibold text-[var(--vms-action)] hover:underline"
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
