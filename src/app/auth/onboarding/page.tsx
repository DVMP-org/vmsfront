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
    const token = searchParams.get("token");

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
                setUserData(response.data);

                // Pre-fill form
                setValue("first_name", response.data.first_name || "");
                setValue("last_name", response.data.last_name || "");
                setValue("phone", response.data.phone || "");
                setValue("address", response.data.address || "");
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
                    <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" />
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
        <div className="min-h-screen bg-gradient-to-br from-[var(--brand-primary)]/10 via-background to-[var(--brand-secondary)]/10 flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--brand-primary)]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--brand-secondary)]/5 rounded-full blur-[120px]" />

            <div className="mb-12 relative z-10 transition-all duration-700 transform hover:scale-105">
                <LogoFull width={220} height={66} />
            </div>

            <Card className="w-full max-w-xl shadow-2xl border-none bg-white/70 dark:bg-black/40 backdrop-blur-xl group relative z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 to-transparent opacity-50 rounded-[var(--radius)] pointer-events-none" />

                <CardHeader className="space-y-4 text-center pb-8 border-b border-border/50 relative px-8 pt-10">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-2xl bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20 animate-in fade-in zoom-in duration-500">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
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
                            step === 1 ? "bg-[var(--brand-primary)] w-16" : "bg-muted shadow-inner"
                        )} />
                        <div className={cn(
                            "h-2 w-12 rounded-full transition-all duration-500",
                            step === 2 ? "bg-[var(--brand-primary)] w-16" : "bg-muted shadow-inner"
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
                                    className="w-full h-14 text-lg font-semibold group bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 shadow-xl shadow-[var(--brand-primary)]/10"
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
                                    placeholder="Block A, House 7, Example Estate"
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
                                        className="flex-1 h-14 text-lg font-bold bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 shadow-xl shadow-[var(--brand-primary)]/10"
                                        isLoading={onboardMutation.isPending}
                                    >
                                        {onboardMutation.isPending ? "Activating..." : "Complete Activation"}
                                        {!onboardMutation.isPending && <CheckCircle2 className="ml-2 h-5 w-5" />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-xs text-muted-foreground/80 leading-relaxed px-4">
                            By activating your account, you agree to our <span className="text-[var(--brand-primary)] font-medium cursor-pointer hover:underline">Terms of Service</span> and <span className="text-[var(--brand-primary)] font-medium cursor-pointer hover:underline">Privacy Policy</span>.
                        </p>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-12 text-sm text-center text-muted-foreground relative z-10 bg-white/20 dark:bg-black/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/30">
                Need help? <span className="text-[var(--brand-primary)] font-semibold cursor-pointer hover:underline">Contact Support</span>
                <span className="mx-3 opacity-30">|</span>
                Already active?{" "}
                <button
                    onClick={() => { clearAuth(); router.push("/auth/login"); }}
                    className="text-[var(--brand-primary)] font-bold hover:underline"
                >
                    Sign In
                </button>
            </div>
        </div>
    );
}
