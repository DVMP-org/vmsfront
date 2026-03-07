"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    Sparkles,
    Zap,
    Crown,
    ArrowRight,
    Loader2,
    CreditCard,
    Mail,
    Building2,
    MapPin,
    Globe,
    FileText,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useSubscribeToPlan, useSubscriptionPaymentStatus } from "@/hooks/use-subscription";
import { useCurrentOrganization, usePlans } from "@/hooks/use-organization";
import { openPaymentPopup } from "@/lib/payment-popup";
import { toast } from "sonner";
import type { Plan } from "@/types/subscription";
import { BillingDetails } from "@/services/subscription-service";
import { formatPrice } from "@/lib/utils";
import { useTransaction } from "@/hooks/use-resident";
type BillingCycle = "monthly" | "yearly";

// Popular countries for the dropdown
const COUNTRIES = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "NL", name: "Netherlands", flag: "🇳🇱" },
    { code: "ES", name: "Spain", flag: "🇪🇸" },
    { code: "IT", name: "Italy", flag: "🇮🇹" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "BR", name: "Brazil", flag: "🇧🇷" },
    { code: "MX", name: "Mexico", flag: "🇲🇽" },
    { code: "SG", name: "Singapore", flag: "🇸🇬" },
    { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦" },
    { code: "KE", name: "Kenya", flag: "🇰🇪" },
    { code: "GH", name: "Ghana", flag: "🇬🇭" },
];

export interface BillingFormState {
    billing_email: string;
    billing_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    tax_id: string;
}

function PlanCard({
    plan,
    billingCycle,
    isSelected,
    isPopular,
    onSelect,
    isLoading,
}: {
    plan: Plan;
    billingCycle: BillingCycle;
    isSelected: boolean;
    isPopular?: boolean;
    onSelect: () => void;
    isLoading: boolean;
}) {
    const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
    const monthlyEquivalent = billingCycle === "yearly" ? plan.price_yearly / 12 : plan.price_monthly;
    const features = plan.features ? Object.entries(plan.features) : [];
    const savings = billingCycle === "yearly"
        ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={cn(
                "relative flex flex-col rounded-2xl border-2 p-6 transition-all duration-300",
                "bg-white dark:bg-zinc-900",
                isSelected
                    ? "border-[rgb(var(--brand-primary,#213928))] shadow-xl ring-2 ring-[rgb(var(--brand-primary,#213928))]/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg"
            )}
        >
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[rgb(var(--brand-primary,#213928))] text-white text-xs font-semibold">
                        <Crown className="h-3 w-3" />
                        Most Popular
                    </span>
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                {plan.description && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{plan.description}</p>
                )}
            </div>

            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
                        {formatPrice(monthlyEquivalent)}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">/month</span>
                </div>
                {billingCycle === "yearly" && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {formatPrice(price)} billed annually
                        {savings > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                                Save {savings}%
                            </span>
                        )}
                    </p>
                )}
                {plan.trial_days && plan.trial_days > 0 && (
                    <p className="mt-2 text-sm text-[rgb(var(--brand-primary,#213928))] font-medium">
                        {plan.trial_days}-day free trial
                    </p>
                )}
            </div>

            <ul className="flex-1 space-y-3 mb-6">
                {features.map(([key, value]) => (
                    <li key={key} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-300">
                            {typeof value === "boolean" ? key : `${key}: ${value}`}
                        </span>
                    </li>
                ))}
            </ul>

            <Button
                onClick={onSelect}
                variant={isSelected ? "primary" : "outline"}
                size="lg"
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSelected ? (
                    <>
                        Selected
                        <Check className="ml-2 h-4 w-4" />
                    </>
                ) : (
                    <>
                        Select Plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>
        </motion.div>
    );
}

function BillingForm({
    billingDetails,
    onChange,
    errors,
}: {
    billingDetails: BillingFormState;
    onChange: (field: keyof BillingFormState, value: string) => void;
    errors: Partial<Record<keyof BillingFormState, string>>;
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
        >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden">
                {/* Header */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Billing Information</h3>
                            <p className="text-sm text-zinc-500">Required for invoice generation</p>
                        </div>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-zinc-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-400" />
                    )}
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-5 space-y-5 border-t border-zinc-100 dark:border-zinc-800 pt-5">
                                {/* Contact Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        <Mail className="h-4 w-4 text-zinc-400" />
                                        Contact Details
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                Billing Email <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="email"
                                                placeholder="billing@company.com"
                                                value={billingDetails.billing_email}
                                                onChange={(e) => onChange("billing_email", e.target.value)}
                                                className={cn(
                                                    "h-11",
                                                    errors.billing_email && "border-red-500 focus:ring-red-500"
                                                )}
                                            />
                                            {errors.billing_email && (
                                                <p className="text-xs text-red-500">{errors.billing_email}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                Company / Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="Acme Corporation"
                                                value={billingDetails.billing_name}
                                                onChange={(e) => onChange("billing_name", e.target.value)}
                                                className={cn(
                                                    "h-11",
                                                    errors.billing_name && "border-red-500 focus:ring-red-500"
                                                )}
                                            />
                                            {errors.billing_name && (
                                                <p className="text-xs text-red-500">{errors.billing_name}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        <MapPin className="h-4 w-4 text-zinc-400" />
                                        Billing Address
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                Street Address <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="123 Business Avenue"
                                                value={billingDetails.address_line1}
                                                onChange={(e) => onChange("address_line1", e.target.value)}
                                                className={cn(
                                                    "h-11",
                                                    errors.address_line1 && "border-red-500 focus:ring-red-500"
                                                )}
                                            />
                                            {errors.address_line1 && (
                                                <p className="text-xs text-red-500">{errors.address_line1}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                Apt, Suite, etc. <span className="text-zinc-400 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="Suite 400"
                                                value={billingDetails.address_line2}
                                                onChange={(e) => onChange("address_line2", e.target.value)}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                    City <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="San Francisco"
                                                    value={billingDetails.city}
                                                    onChange={(e) => onChange("city", e.target.value)}
                                                    className={cn(
                                                        "h-11",
                                                        errors.city && "border-red-500 focus:ring-red-500"
                                                    )}
                                                />
                                                {errors.city && (
                                                    <p className="text-xs text-red-500">{errors.city}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                    State / Province
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="California"
                                                    value={billingDetails.state}
                                                    onChange={(e) => onChange("state", e.target.value)}
                                                    className="h-11"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                    Postal / ZIP Code
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="94102"
                                                    value={billingDetails.postal_code}
                                                    onChange={(e) => onChange("postal_code", e.target.value)}
                                                    className="h-11"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                    Country <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={billingDetails.country}
                                                        onChange={(e) => onChange("country", e.target.value)}
                                                        className={cn(
                                                            "w-full h-11 pl-10 pr-4 rounded-md border border-zinc-300 dark:border-zinc-700",
                                                            "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
                                                            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))] focus:border-transparent",
                                                            "appearance-none cursor-pointer text-sm",
                                                            errors.country && "border-red-500 focus:ring-red-500"
                                                        )}
                                                    >
                                                        <option value="">Select country...</option>
                                                        {COUNTRIES.map((country) => (
                                                            <option key={country.code} value={country.code}>
                                                                {country.flag} {country.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                                                </div>
                                                {errors.country && (
                                                    <p className="text-xs text-red-500">{errors.country}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tax ID */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        <Building2 className="h-4 w-4 text-zinc-400" />
                                        Tax Information <span className="text-zinc-400 text-xs font-normal">(Optional)</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                            Tax ID / VAT Number
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="US 12-3456789 or GB 123456789"
                                            value={billingDetails.tax_id}
                                            onChange={(e) => onChange("tax_id", e.target.value)}
                                            className="h-11 font-mono max-w-md"
                                        />
                                        <p className="text-xs text-zinc-500">
                                            For business tax exemption and invoice compliance
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default function PlansPage() {
    const router = useRouter();
    const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const [billingDetails, setBillingDetails] = useState<BillingFormState>({
        billing_email: "",
        billing_name: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        tax_id: "",
    });
    const [billingErrors, setBillingErrors] = useState<Partial<Record<keyof BillingFormState, string>>>({});

    const { data: plans, isLoading: plansLoading } = usePlans();
    const { organization } = useCurrentOrganization();
    const { mutateAsync: subscribe, isPending: isSubscribing } = useSubscribeToPlan();
    const { data: paymentStatus } = useTransaction(paymentReference);

    const activePlans = plans?.filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order) || [];
    const selectedPlan = activePlans.find(p => p.id === selectedPlanId);

    // Determine if selected plan requires payment
    const requiresPayment = selectedPlan && (
        (billingCycle === "monthly" && selectedPlan.price_monthly > 0) ||
        (billingCycle === "yearly" && selectedPlan.price_yearly > 0)
    );

    const handleBillingChange = useCallback((field: keyof BillingFormState, value: string) => {
        setBillingDetails(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (billingErrors[field]) {
            setBillingErrors(prev => ({ ...prev, [field]: undefined }));
        }
    }, [billingErrors]);

    const validateBillingDetails = useCallback((): boolean => {
        const errors: Partial<Record<keyof BillingFormState, string>> = {};

        if (!billingDetails.billing_email) {
            errors.billing_email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingDetails.billing_email)) {
            errors.billing_email = "Please enter a valid email";
        }

        if (!billingDetails.billing_name) {
            errors.billing_name = "Name is required";
        }

        if (!billingDetails.address_line1) {
            errors.address_line1 = "Street address is required";
        }

        if (!billingDetails.city) {
            errors.city = "City is required";
        }

        if (!billingDetails.country) {
            errors.country = "Country is required";
        }

        setBillingErrors(errors);
        return Object.keys(errors).length === 0;
    }, [billingDetails]);

    // Watch payment status when payment reference is set
    useEffect(() => {
        if (paymentStatus && paymentReference) {
            if (paymentStatus.status === "success") {
                toast.success("Payment successful! Subscription activated.");
                setPaymentReference(null);
                // Redirect to dashboard or admin after successful subscription
                router.push("/admin");
            } else if (paymentStatus.status === "failed") {
                toast.error("Payment failed. Please try again.");
                setPaymentReference(null);
            }
        }
    }, [paymentStatus, paymentReference, router]);

    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlanId(plan.id);
    };

    const handleSubscribe = useCallback(async () => {
        if (!selectedPlanId || !selectedPlan) return;

        // Validate billing details for paid plans
        if (requiresPayment && !validateBillingDetails()) {
            toast.error("Please fill in all required billing fields");
            return;
        }

        // Build billing details object (only non-empty fields)
        const billingDetailsPayload: BillingDetails = {};
        if (billingDetails.billing_email) billingDetailsPayload.billing_email = billingDetails.billing_email;
        if (billingDetails.billing_name) billingDetailsPayload.billing_name = billingDetails.billing_name;
        if (billingDetails.address_line1) billingDetailsPayload.address_line1 = billingDetails.address_line1;
        if (billingDetails.address_line2) billingDetailsPayload.address_line2 = billingDetails.address_line2;
        if (billingDetails.city) billingDetailsPayload.city = billingDetails.city;
        if (billingDetails.state) billingDetailsPayload.state = billingDetails.state;
        if (billingDetails.postal_code) billingDetailsPayload.postal_code = billingDetails.postal_code;
        if (billingDetails.country) billingDetailsPayload.country = billingDetails.country;
        if (billingDetails.tax_id) billingDetailsPayload.tax_id = billingDetails.tax_id;

        try {
            const response = await subscribe({
                plan_id: selectedPlanId,
                billing_cycle: billingCycle,
                ...Object.keys(billingDetailsPayload).length > 0 ? billingDetailsPayload : undefined,
            });

            const data = response.data;

            // Check if it's a free plan (direct subscription returned)
            if (data?.subscription) {
                // Free plan - subscription created directly
                router.push("/admin");
                return;
            }

            // Paid plan - payment required
            if (data?.authorization_url && data?.reference) {
                setPaymentReference(data.reference);

                // Open payment popup
                openPaymentPopup(
                    data.authorization_url,
                    data.reference,
                    (ref) => {
                        // Popup closed, the useSubscriptionPaymentStatus hook will handle polling
                        console.log("Payment popup closed, polling subscription payment:", ref);
                    },
                    (error) => {
                        toast.error(error || "Payment cancelled");
                        setPaymentReference(null);
                    }
                );
            } else {
                toast.error("Failed to initiate payment");
            }
        } catch (error) {
            // Error is already handled by the hook
            console.error("Subscribe error:", error);
        }
    }, [selectedPlanId, selectedPlan, billingCycle, billingDetails, requiresPayment, validateBillingDetails, subscribe, router]);

    const popularPlanIndex = Math.floor(activePlans.length / 2);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background relative overflow-hidden flex flex-col">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-[rgb(var(--brand-primary,#213928))]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -translate-x-1/2 w-[400px] h-[400px] bg-[rgb(var(--brand-primary,#213928))]/5 rounded-full blur-3xl pointer-events-none" />

            <Header type="select" />

            <main className="flex-1 relative z-10">
                <div className="max-w-6xl mx-auto py-12 px-6 sm:py-20 lg:px-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/50 dark:border-zinc-800/50 mb-6">
                            <Sparkles className="h-8 w-8 text-[rgb(var(--brand-primary,#213928))]" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                            Choose Your Plan
                        </h1>
                        <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
                            {organization?.name ? (
                                <>Select a subscription plan for <span className="font-semibold text-zinc-700 dark:text-zinc-300">{organization.name}</span></>
                            ) : (
                                "Select a subscription plan to get started with all features"
                            )}
                        </p>
                    </motion.div>

                    {/* Billing Toggle */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center mb-10"
                    >
                        <div className="inline-flex items-center gap-3 px-1 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <button
                                onClick={() => setBillingCycle("monthly")}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    billingCycle === "monthly"
                                        ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-50"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle("yearly")}
                                className={cn(
                                    "relative px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    billingCycle === "yearly"
                                        ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-50"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                Yearly
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                    SAVE
                                </span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Plans Grid */}
                    {plansLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <CardSkeleton />
                            <CardSkeleton />
                            <CardSkeleton />
                        </div>
                    ) : activePlans.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center"
                        >
                            <EmptyState
                                icon={Zap}
                                title="No Plans Available"
                                description="There are no subscription plans available at the moment. Please check back later."
                            />
                        </motion.div>
                    ) : (
                        <>
                            <div
                                className={cn(
                                    "grid gap-6",
                                    activePlans.length === 1 && "max-w-md mx-auto",
                                    activePlans.length === 2 && "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto",
                                    activePlans.length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                )}
                            >
                                {activePlans.map((plan, index) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        billingCycle={billingCycle}
                                        isSelected={selectedPlanId === plan.id}
                                        isPopular={index === popularPlanIndex && activePlans.length > 1}
                                        onSelect={() => handleSelectPlan(plan)}
                                        isLoading={isSubscribing && selectedPlanId === plan.id}
                                    />
                                ))}
                            </div>

                            {/* Billing Form - Show when paid plan is selected */}
                            <AnimatePresence>
                                {selectedPlanId && requiresPayment && !paymentReference && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mt-10"
                                    >
                                        <BillingForm
                                            billingDetails={billingDetails}
                                            onChange={handleBillingChange}
                                            errors={billingErrors}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Subscribe Button */}
                            {selectedPlanId && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-10 text-center"
                                >
                                    {paymentReference ? (
                                        <div className="inline-flex flex-col items-center gap-4 p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                                                <div className="text-left">
                                                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                                                        Awaiting Payment...
                                                    </p>
                                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                                        Please complete the transaction in the popup window.
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPaymentReference(null)}
                                                className="text-amber-700 border-amber-300 hover:bg-amber-100"
                                            >
                                                Cancel Payment
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={handleSubscribe}
                                                size="lg"
                                                isLoading={isSubscribing}
                                                className="px-8"
                                            >
                                                {requiresPayment ? (
                                                    <>
                                                        <CreditCard className="mr-2 h-5 w-5" />
                                                        Proceed to Payment
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap className="mr-2 h-5 w-5" />
                                                        Activate Free Plan
                                                    </>
                                                )}
                                            </Button>
                                            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                                                {requiresPayment
                                                    ? "You will be redirected to our secure payment portal"
                                                    : "You can upgrade to a paid plan at any time"}
                                            </p>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </>
                    )}

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-16 text-center"
                    >
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                            All plans include
                        </h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            {[
                                "Unlimited gate passes",
                                "Real-time notifications",
                                "Mobile access",
                                "24/7 support",
                                "Data encryption",
                            ].map((feature) => (
                                <span
                                    key={feature}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-300"
                                >
                                    <Check className="h-4 w-4 text-green-500" />
                                    {feature}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
