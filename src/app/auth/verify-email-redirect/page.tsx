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
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {state === "loading"
                  ? "Verifying your email"
                  : state === "success"
                    ? "Email verified!"
                    : "Verification failed"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[360px] mx-auto">
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
                <div className="absolute inset-[-20px] bg-[rgb(var(--brand-primary,#213928))]/10 blur-2xl rounded-full animate-pulse" />
                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
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
              className="flex items-start gap-4 p-5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-3xl"
            >
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-green-900 dark:text-green-200 font-medium">
                  Email verified successfully!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
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
              className="flex items-start gap-4 p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-3xl"
            >
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-red-900 dark:text-red-200 font-medium">
                  {errorMessage}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
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
                className="w-full h-14 text-base font-bold rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                <Link href="/auth/login">Back to Login</Link>
              </Button>
              <Button
                asChild
                className="w-full h-14 text-base font-bold rounded-2xl bg-[rgb(var(--brand-primary,#213928))] text-white hover:bg-[rgb(var(--brand-primary,#213928))]/90 transition-all active:scale-[0.98]"
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
