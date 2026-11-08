"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  User2Icon,
} from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { motion } from "framer-motion";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    register,
    isRegistering,
    registerError,
    registerFieldErrors,
    clearAuthErrors,
  } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[e.target.name];
        return updated;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    clearAuthErrors();
    const { confirmPassword, ...registerData } = formData;
    register(registerData);
  };

  return (
    <AuthLayout
      title="Create your account."
      description="Start with your identity. Organization and property context comes next."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {registerError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_24%,white)] bg-[var(--vms-danger-subtle)] px-3.5 py-3 text-sm leading-5 text-[var(--vms-danger)]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {registerError}
          </motion.div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              name="first_name"
              label="First name"
              placeholder="Ada"
              icon={User2Icon}
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name || registerFieldErrors.first_name}
              className="h-11"
            />
            <Input
              type="text"
              name="last_name"
              label="Last name"
              placeholder="Okafor"
              icon={User2Icon}
              value={formData.last_name}
              onChange={handleChange}
              error={errors.last_name || registerFieldErrors.last_name}
              className="h-11"
            />
          </div>

          <Input
            type="email"
            name="email"
            label="Work email"
            placeholder="you@organization.com"
            value={formData.email}
            icon={Mail}
            onChange={handleChange}
            error={errors.email || registerFieldErrors.email}
            className="h-11"
          />

          <Input
            type="tel"
            name="phone"
            label="Phone (optional)"
            icon={Phone}
            placeholder="+1234567890"
            value={formData.phone}
            onChange={handleChange}
            error={registerFieldErrors.phone}
            className="h-11"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordInput
              name="password"
              label="Password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              error={errors.password || registerFieldErrors.password}
              className="h-11 "
            />
            <PasswordInput
              name="confirmPassword"
              label="Confirm password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={Lock}
              error={
                errors.confirmPassword ||
                registerFieldErrors.confirmPassword ||
                registerFieldErrors.password
              }
              className="h-11 "
            />
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 w-full justify-between px-4 text-sm"
          isLoading={isRegistering}
          rightNode={
            !isRegistering ? <ArrowRight className="h-4 w-4" /> : undefined
          }
        >
          Create account
        </Button>

        <p className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3.5 py-3 text-center text-xs leading-5 text-[var(--vms-ink-muted)]">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
          >
            Sign in instead
          </Link>
        </p>
      </form>
      <SocialLoginButtons />
    </AuthLayout>
  );
}
