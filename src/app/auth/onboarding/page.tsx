"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboard } from "@/hooks/use-auth";
import { authService } from "@/services/auth-service";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Loader2, ShieldCheck, Mail, User, Phone, MapPin, Lock, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { PasswordInput } from "@/components/ui/password-input";
import { LogoFull } from "@/components/LogoFull";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const onboardingSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().min(1, "Address is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams?.get("token");

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [step, setStep] = useState(1);

    const onboardMutation = useOnboard();
    const { clearAuth } = useAuthStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        trigger,
        watch,
    } = useForm<OnboardingValues>({
        resolver: zodResolver(onboardingSchema),
        mode: "onBlur",
    });

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const verify = async () => {
            try {
                clearAuth();
                apiClient.setToken(token);
                const response = await authService.verifyToken();
                setUserData(response.data.user);
                // Pre-fill form
                setValue("first_name", response.data.user.first_name || "");
                setValue("last_name", response.data.user.last_name || "");
                setValue("phone", response.data.user.phone || "");
                setValue("address", response.data.user.address || "");
            } catch (error: any) {
                toast.error("Invalid or expired onboarding link.");
                router.push("/auth/login");
            } finally {
                setLoading(false);
            }
        };

        verify();
    }, [token, router, setValue, clearAuth]);

    const nextStep = async () => {
        const isValid = await trigger(["first_name", "last_name", "phone"]);
        if (isValid) {
            setStep(2);
        }
    };

    const prevStep = () => {
        setStep(1);
    };

    const onSubmit = (data: OnboardingValues) => {
        onboardMutation.mutate({
            ...data,
            email: userData?.email,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[var(--vms-action)] motion-reduce:animate-none" />
                    <p className="text-muted-foreground animate-pulse">Verifying your invitation...</p>
                </div>
            </div>
        );
    }

    if (!token || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-dashed">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle>Invalid Invitation</CardTitle>
                        <CardDescription>
                            This invitation link is invalid or has expired. Please contact your estate administrator.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" onClick={() => router.push("/auth/login")}>
                            Go to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--vms-canvas)] px-4 py-12 text-[var(--vms-ink)]">
            <div className="relative z-10 mb-10">
                <LogoFull width={220} height={66} />
            </div>

            <Card className="relative z-10 w-full max-w-xl">
                <CardHeader className="space-y-4 border-b border-[var(--vms-line)] px-6 pb-8 pt-8 text-center sm:px-8 sm:pt-10">
                    <div className="flex justify-center">
                        <div className="rounded-[var(--vms-radius-surface)] bg-[var(--vms-action)] p-4 text-[var(--vms-on-action)]">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-[28px] font-semibold tracking-[-0.035em]">
                            {step === 1 ? "Personal Profile" : "Security Setup"}
                        </CardTitle>
                        <CardDescription className="text-base mt-2 max-w-xs mx-auto">
                            {step === 1
                                ? "Let's start with your basic information to get your account ready."
                                : "Secure your account and provide your residence details."}
                        </CardDescription>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <div className={cn(
                            "h-2 w-12 rounded-full transition-all duration-500",
                            step === 1 ? "w-16 bg-[var(--vms-action)]" : "bg-[var(--vms-surface-subtle)]"
                        )} />
                        <div className={cn(
                            "h-2 w-12 rounded-full transition-all duration-500",
                            step === 2 ? "w-16 bg-[var(--vms-action)]" : "bg-[var(--vms-surface-subtle)]"
                        )} />
                    </div>
                </CardHeader>

                <CardContent className="pt-10 px-8 pb-10">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {step === 1 ? (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <div className="grid grid-cols-2 gap-5">
                                    <Input
                                        id="first_name"
                                        label="First Name"
                                        {...register("first_name")}
                                        error={errors.first_name?.message}
                                        placeholder="John"
                                        icon={User}
                                    />
                                    <Input
                                        id="last_name"
                                        label="Last Name"
                                        {...register("last_name")}
                                        error={errors.last_name?.message}
                                        placeholder="Doe"
                                        icon={User}
                                    />
                                </div>
                                <Input
                                    label="Email Address"
                                    value={userData.email || ""}
                                    readOnly={true}
                                    disabled={true}
                                    className="bg-muted/40 cursor-not-allowed border-dashed"
                                    icon={Mail}
                                    description="Your registered email address"
                                />
                                <Input
                                    id="phone"
                                    label="Phone Number"
                                    {...register("phone")}
                                    error={errors.phone?.message}
                                    placeholder="+234..."
                                    icon={Phone}
                                />

                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="w-full h-14 text-lg font-semibold group"
                                >
                                    Continue to Security
                                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <Input
                                    id="address"
                                    label="Residence Address"
                                    {...register("address")}
                                    error={errors.address?.message}
                                    placeholder="Block A, Residency 7, Example Estate"
                                    icon={MapPin}
                                />
                                <div className="space-y-4">
                                    <PasswordInput
                                        id="password"
                                        label="Create Password"
                                        {...register("password")}
                                        error={errors.password?.message}
                                        placeholder="Min 8 characters"
                                    />
                                    <PasswordInput
                                        id="confirm_password"
                                        label="Confirm Password"
                                        {...register("confirm_password")}
                                        error={errors.confirm_password?.message}
                                        placeholder="Repeat your password"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={prevStep}
                                        className="h-14 px-6 border-muted-foreground/20 hover:bg-muted"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-14 text-lg font-bold "
                                        isLoading={onboardMutation.isPending}
                                    >
                                        {onboardMutation.isPending ? "Activating..." : "Complete Activation"}
                                        {!onboardMutation.isPending && <CheckCircle2 className="ml-2 h-5 w-5" />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-xs text-muted-foreground/80 leading-relaxed px-4">
                            By activating your account, you agree to our <span className="font-medium text-[var(--vms-action)]">Terms of Service</span> and <span className="font-medium text-[var(--vms-action)]">Privacy Policy</span>.
                        </p>
                    </form>
                </CardContent>
            </Card>

            <div className="relative z-10 mt-10 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-6 py-3 text-center text-sm text-[var(--vms-ink-muted)]">
                Need help? <span className="font-semibold text-[var(--vms-action)]">Contact Support</span>
                <span className="mx-3 opacity-30">|</span>
                Already active?{" "}
                <button
                    onClick={() => { clearAuth(); router.push("/auth/login"); }}
                    className="font-semibold text-[var(--vms-action)] hover:underline"
                >
                    Sign In
                </button>
            </div>
        </div>
    );
}
