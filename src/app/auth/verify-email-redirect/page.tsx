"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";

export default function VerifyEmailRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const { user } = useAuthStore();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Validate token exists
        if (!token) {
          setErrorMessage("No verification token provided. Please check your email link.");
          setState("error");
          return;
        }

        // Call the verify-email API endpoint with GET request
        const response = await authService.verifyEmail(token);

        if (response.success) {
          setState("success");
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push("/select");
          }, 2000);
        } else {
          setErrorMessage(response.message || "Email verification failed. Please try again.");
          setState("error");
        }
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || 
                        error?.message || 
                        "Failed to verify email. Please check your link and try again.";
        setErrorMessage(errorMsg);
        setState("error");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
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
                {state === "success" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--vms-ink)]">
                {state === "loading"
                  ? "Verifying your email"
                  : state === "success"
                    ? "Email verified!"
                    : "Verification failed"}
              </h1>
              <p className="mx-auto max-w-[360px] text-sm leading-relaxed text-[var(--vms-ink-muted)]">
                {state === "loading"
                  ? "Please wait while we verify your email address..."
                  : state === "success"
                    ? `Welcome ${user?.first_name || "there"}! Your email has been verified. Redirecting to your dashboard...`
                    : errorMessage}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {state === "loading" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center py-12"
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
            </motion.div>
          )}

          {/* Success State */}
          {state === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-4 rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-success)_35%,white)] bg-[var(--vms-success-subtle)] p-5"
            >
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[var(--vms-success)]" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--vms-success)]">
                  Email verified successfully!
                </p>
                <p className="text-xs text-[var(--vms-success)]">
                  You're all set. Redirecting to your dashboard...
                </p>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {state === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4 rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-5"
            >
              <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-[var(--vms-danger)]" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--vms-danger)]">
                  {errorMessage}
                </p>
                <p className="text-xs text-[var(--vms-danger)]">
                  The verification link may be invalid or expired.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Action Buttons */}
          {state === "error" && (
            <div className="space-y-3">
              <Button
                variant="outline"
                asChild
                className="h-12 w-full rounded-[var(--vms-radius-control)] text-base font-semibold"
              >
                <Link href="/auth/login">Back to Login</Link>
              </Button>
              <Button
                asChild
                className="h-12 w-full rounded-[var(--vms-radius-control)] bg-[var(--vms-action)] text-base font-semibold text-[var(--vms-on-action)] hover:bg-[var(--vms-action-hover)]"
              >
                <Link href="/auth/verify-email">Request New Link</Link>
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
