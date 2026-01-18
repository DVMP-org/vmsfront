import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Lock, Mail, Phone, User2Icon } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { motion } from "framer-motion";

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
    const { register, isRegistering, registerError, registerFieldErrors, clearAuthErrors } = useAuth();

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
            title="Create account"
            description="Enter your information to get started"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {registerError && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                        {registerError}
                    </motion.div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            type="text"
                            name="first_name"
                            label="First Name"
                            placeholder="John"
                            icon={User2Icon}
                            value={formData.first_name}
                            onChange={handleChange}
                            error={errors.first_name || registerFieldErrors.first_name}
                            className="h-11"
                        />
                        <Input
                            type="text"
                            name="last_name"
                            label="Last Name"
                            placeholder="Doe"
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
                        label="Email Address"
                        placeholder="name@example.com"
                        value={formData.email}
                        icon={Mail}
                        onChange={handleChange}
                        error={errors.email || registerFieldErrors.email}
                        className="h-11"
                    />

                    <Input
                        type="tel"
                        name="phone"
                        label="Phone (Optional)"
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
                            label="Confirm Password"
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
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    isLoading={isRegistering}
                >
                    Create Account
                </Button>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <Link href="/auth/login" className="text-[var(--brand-primary)] hover:underline font-bold transition-all">
                        Sign in
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
