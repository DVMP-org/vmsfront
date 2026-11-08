"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const [email, setEmail] = useState(
    process.env.NODE_ENV === "production" ? "" : "admin@admin.com",
  );
  const [password, setPassword] = useState(
    process.env.NODE_ENV === "production" ? "" : "password",
  );
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const { login, isLoggingIn, loginError, loginFieldErrors, clearAuthErrors } =
    useAuth();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};
    if (!email) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    clearAuthErrors();
    login({ email, password });
  };

  return (
    <AuthLayout
      title="Welcome back."
      description="Sign in to continue to the property workspace that belongs to you."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {loginError ? (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_24%,white)] bg-[var(--vms-danger-subtle)] px-3.5 py-3 text-sm leading-5 text-[var(--vms-danger)]"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {loginError}
          </motion.div>
        ) : null}

        <div className="space-y-4">
          <Input
            id="login_email_input"
            type="email"
            label="Work email"
            placeholder="you@organization.com"
            autoComplete="email"
            icon={Mail}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email || loginFieldErrors.email}
            className="h-12 bg-[var(--vms-surface)]"
          />

          <div>
            <PasswordInput
              id="login_password_input"
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              icon={Lock}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password || loginFieldErrors.password}
              className="h-12 bg-[var(--vms-surface)]"
            />
            <div className="mt-2 flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-[var(--vms-ink-muted)] underline-offset-4 hover:text-[var(--vms-ink)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </div>

        <Button
          id="login_submit_button"
          type="submit"
          className="h-12 w-full justify-between px-4 text-sm"
          isLoading={isLoggingIn}
          rightNode={
            !isLoggingIn ? <ArrowRight className="h-4 w-4" /> : undefined
          }
        >
          Continue to workspace
        </Button>

        <p className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3.5 py-3 text-center text-xs leading-5 text-[var(--vms-ink-muted)]">
          New to VMS Core?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
          >
            Create your account
          </Link>
        </p>
      </form>

      <SocialLoginButtons />
    </AuthLayout>
  );
}
