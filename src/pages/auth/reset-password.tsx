import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useResetPassword } from "@/hooks/use-auth";
import { KeyRound, ArrowLeft, RefreshCw } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { token: queryToken } = router.query;
    const token = (queryToken as string) || "";

    const resetPassword = useResetPassword(() => router.push("/auth/login"));

    const [formData, setFormData] = useState({
        email: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const tokenMissing = useMemo(() => !router.isReady ? false : token.trim().length === 0, [token, router.isReady]);

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

    if (!router.isReady) return null;

    if (tokenMissing && !resetPassword.isPending) {
        return (
            <AuthLayout
                title="Check failed"
                description="The password reset link is missing or has expired"
            >
                <div className="text-center py-8 space-y-6">
                    <div className="mx-auto w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
                        <KeyRound className="w-10 h-10 text-yellow-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Invalid Link</h3>
                        <p className="text-muted-foreground">
                            For security reasons, reset links expire quickly. Please request a new one to continue.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <Link href="/auth/forgot-password" title="Request new link">
                            <Button className="w-full h-12 gap-2 text-base font-semibold">
                                <RefreshCw className="w-4 h-4" />
                                Request New Link
                            </Button>
                        </Link>
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Create new password"
            description="Enter a secure password for your account"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.token && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                        {errors.token}
                    </motion.div>
                )}

                <div className="space-y-4">
                    <Input
                        type="email"
                        label="Account Email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(event) =>
                            setFormData((prev) => ({ ...prev, email: event.target.value }))
                        }
                        error={errors.email}
                        required
                        className="h-12"
                    />

                    <Input
                        type="password"
                        label="New Password"
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
                        className="h-12"
                    />

                    <Input
                        type="password"
                        label="Confirm New Password"
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
                        className="h-12"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    isLoading={resetPassword.isPending}
                >
                    Save New Password
                </Button>

                <div className="text-center">
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[var(--brand-primary)] transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to login
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
