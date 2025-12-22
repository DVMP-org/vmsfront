"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useResetPassword } from "@/hooks/use-auth";
import { ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const resetPassword = useResetPassword(() => router.push("/auth/login"));

  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tokenMissing = useMemo(() => token.trim().length === 0, [token]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!formData.email) nextErrors.email = "Email is required";
    if (!formData.newPassword) nextErrors.newPassword = "New password is required";
    if (formData.newPassword.length < 8)
      nextErrors.newPassword = "Password must be at least 8 characters long";
    if (!formData.confirmPassword)
      nextErrors.confirmPassword = "Confirm your new password";
    if (
      formData.newPassword &&
      formData.confirmPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    if (tokenMissing) {
      nextErrors.token = "Reset token missing. Request a new email.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    resetPassword.mutate({
      email: formData.email,
      token,
      password: formData.newPassword,
    });
  };

  if (tokenMissing && !resetPassword.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-var(--brand-primary)/5 via-background to-var(--brand-secondary)/10 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle>Reset link expired</CardTitle>
            <CardDescription>
              The password reset link is missing or has expired. Request a new one to
              continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/forgot-password">
              <Button className="w-full">Request new link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-var(--brand-primary)/5 via-background to-var(--brand-secondary)/10 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-var(--brand-primary)/10 text-var(--brand-primary)">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Choose a new password
          </CardTitle>
          <CardDescription>
            Use the form below to secure your account. After saving, you will be
            redirected to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.token && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {errors.token}
              </div>
            )}

            <Input
              type="email"
              label="Account email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, email: event.target.value }))
              }
              error={errors.email}
              required
            />



            <Input
              type="password"
              label="New password"
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  newPassword: event.target.value,
                }))
              }
              error={errors.newPassword}
              required
            />

            <Input
              type="password"
              label="Confirm new password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword: event.target.value,
                }))
              }
              error={errors.confirmPassword}
              required
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={resetPassword.isPending}
            >
              Save new password
            </Button>

            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4 text-var(--brand-primary)" />
              Back to login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
