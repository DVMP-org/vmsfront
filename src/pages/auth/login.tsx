import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>(
        {}
    );
    const { login, isLoggingIn, loginError, loginFieldErrors, clearAuthErrors } =
        useAuth();
    const router = useRouter();

    // Prefetch dashboard routes to speed up transition after login
    useEffect(() => {
        router.prefetch("/select");
        router.prefetch("/admin");
    }, [router]);

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
        <AuthLayout
            title="Welcome back"
            description="Enter your credentials to access your account"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {loginError && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                        {loginError}
                    </motion.div>
                )}

                <div className="space-y-4">
                    <Input
                        type="email"
                        label="Email Address"
                        placeholder="name@example.com"
                        icon={Mail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email || loginFieldErrors.email}
                        className="h-12"
                    />

                    <div className="space-y-1">
                        <PasswordInput
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            icon={Lock}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password || loginFieldErrors.password}
                            className="h-12"
                        />
                        <div className="flex justify-end">
                            <Link
                                href="/auth/forgot-password"
                                className="text-xs font-medium text-[var(--brand-primary)] hover:underline opacity-80 hover:opacity-100 transition-opacity"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    isLoading={isLoggingIn}
                >
                    Sign In
                </Button>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">
                        Don&apos;t have an account?{" "}
                    </span>
                    <Link
                        href="/auth/register"
                        className="text-[var(--brand-primary)] hover:underline font-bold transition-all"
                    >
                        Create account
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
