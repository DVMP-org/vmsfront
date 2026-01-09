"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Link from "next/link";
import { Home, Lock, Mail } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { Logo } from "@/components/Logo";
import { LogoFull } from "@/components/LogoFull";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const { login, isLoggingIn, loginError, loginFieldErrors, clearAuthErrors } =
    useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    clearAuthErrors();
    login({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="">
              <LogoFull width={200} height={80} />
              {/* <Home className="h-8 w-8 text-primary" /> */}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {loginError}
              </div>
            )}
            <Input
              type="email"
              label="Email"
              placeholder="name@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email || loginFieldErrors.email}
            />
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              value={password}
              icon={Lock}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password || loginFieldErrors.password}
            />
            <div className="flex justify-end text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-[var(--brand-primary)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" isLoading={isLoggingIn}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/auth/register"
              className="text-[var(--brand-primary)] hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
