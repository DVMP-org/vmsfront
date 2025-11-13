"use client";

import { useState } from "react";
import Link from "next/link";
import { useForgotPassword } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const forgotPassword = useForgotPassword();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter the email associated with your account.");
      return;
    }

    forgotPassword.mutate(
      { email },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: () => {
          setSubmitted(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Reset your password
          </CardTitle>
          <CardDescription>
            Enter the email linked to your VMSCORE account and we&apos;ll send you
            a secure reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitted ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                Check {email} for a password reset email. It may take a few
                minutes to arrive.
              </div>
            ) : (
              <>
                {error && (
                  <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={forgotPassword.isPending}
                >
                  Send reset link
                </Button>
              </>
            )}
            <Link
              href="/auth/login"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
