import { useState } from "react";
import Link from "next/link";
import { useForgotPassword } from "@/hooks/use-auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { motion, AnimatePresence } from "framer-motion";

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
                onError: (err: any) => {
                    setSubmitted(false);
                    setError(err?.response?.data?.message || "Something went wrong. Please try again.");
                },
            }
        );
    };

    return (
        <AuthLayout
            title="Reset password"
            description="Enter your email to receive a secure reset link"
        >
            <AnimatePresence mode="wait">
                {submitted ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8 space-y-6"
                    >
                        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-[var(--brand-primary)]" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Check your email</h3>
                            <p className="text-muted-foreground">
                                We&apos;ve sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
                            </p>
                        </div>
                        <Link
                            href="/auth/login"
                            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] hover:underline group"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to login
                        </Link>
                    </motion.div>
                ) : (
                    <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                {error}
                            </motion.div>
                        )}

                        <Input
                            type="email"
                            label="Email Address"
                            placeholder="you@example.com"
                            icon={Mail}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            className="h-12"
                        />

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                            isLoading={forgotPassword.isPending}
                        >
                            Send Reset Link
                        </Button>

                        <div className="text-center pt-2">
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[var(--brand-primary)] transition-colors group"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                Back to login
                            </Link>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </AuthLayout>
    );
}
