"use client";

import { useState, useEffect, useMemo } from "react";
import {
    useBillingSettings,
    useUpdateBillingSettings,
    useCreateCheckoutSession,
    usePaymentMethods,
    useSetDefaultPaymentMethod,
    useDeletePaymentMethod,
} from "@/hooks/use-subscription";
import { PaymentMethod } from "@/services/subscription-service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    CreditCard,
    Mail,
    MapPin,
    FileText,
    Plus,
    Save,
    AlertCircle,
    Globe,
    Hash,
    ShieldCheck,
    Sparkles,
    Check,
    Trash2,
    Star,
    MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BillingFormState } from "@/app/plans/page";

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

// Card brand logos/icons
const BRAND_CONFIG: Record<string, { gradient: string; logo: string }> = {
    visa: {
        gradient: "from-[#1a1f71] to-[#2d4db3]",
        logo: "VISA"
    },
    mastercard: {
        gradient: "from-[#eb001b] to-[#f79e1b]",
        logo: "MC"
    },
    amex: {
        gradient: "from-[#006fcf] to-[#00a3e0]",
        logo: "AMEX"
    },
    discover: {
        gradient: "from-[#ff6000] to-[#ffb300]",
        logo: "DISCOVER"
    },
};



function SinglePaymentCard({
    paymentMethod,
    isDefault = false,
    onSetDefault,
    onDelete,
    isSettingDefault,
    isDeleting,
}: {
    paymentMethod: PaymentMethod;
    isDefault?: boolean;
    onSetDefault?: () => void;
    onDelete?: () => void;
    isSettingDefault?: boolean;
    isDeleting?: boolean;
}) {
    const [showActions, setShowActions] = useState(false);
    const brandConfig = BRAND_CONFIG[paymentMethod.brand?.toLowerCase() || ""] || {
        gradient: "from-zinc-700 to-zinc-900",
        logo: paymentMethod.brand?.toUpperCase() || "CARD"
    };

    return (
        <div className="group relative">
            {/* Default badge */}
            {isDefault && (
                <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-medium shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    Default
                </div>
            )}

            <div className={cn(
                "relative w-full h-44 rounded-2xl text-white overflow-hidden shadow-lg transition-all duration-300",
                "bg-gradient-to-br",
                brandConfig.gradient,
                isDefault ? "ring-2 ring-green-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900" : "",
                "hover:shadow-xl hover:scale-[1.02]"
            )}>
                {/* Background decorations */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
                </div>

                {/* Subtle pattern */}
                <div className="absolute inset-0 opacity-5 bg-[linear-gradient(135deg,transparent_25%,white_25%,white_50%,transparent_50%,transparent_75%,white_75%)] bg-[length:20px_20px]" />

                {/* Card chip */}
                <div className="absolute top-4 left-4">
                    <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 shadow-sm">
                        <div className="w-full h-full rounded flex items-center justify-center border border-amber-400/50">
                            <div className="w-5 h-3 border border-amber-500/40 rounded-sm bg-amber-200/30" />
                        </div>
                    </div>
                </div>

                {/* Contactless icon */}
                <div className="absolute top-4 right-4">
                    <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8.5 14.5C9.5 13.5 10 12 10 10.5C10 9 9.5 7.5 8.5 6.5" strokeLinecap="round" />
                        <path d="M12 17C14 15 15 12.5 15 10C15 7.5 14 5 12 3" strokeLinecap="round" />
                        <path d="M15.5 19.5C18.5 17 20 13.5 20 10C20 6.5 18.5 3 15.5 0.5" strokeLinecap="round" />
                    </svg>
                </div>

                {/* Card number */}
                <div className="absolute top-16 left-4 right-4">
                    <div className="text-xl tracking-[0.25em] font-mono font-medium flex items-center gap-3">
                        <span className="opacity-50">••••</span>
                        <span className="opacity-50">••••</span>
                        <span className="opacity-50">••••</span>
                        <span>{paymentMethod.last4 || "****"}</span>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/50 block">Expires</span>
                        <span className="font-mono text-sm">{paymentMethod.exp_month || "••"}/{paymentMethod.exp_year || "••"}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-bold tracking-wide">
                            {brandConfig.logo}
                        </span>
                    </div>
                </div>

                {/* Hover actions overlay */}
                {(onSetDefault || onDelete) && (
                    <div className={cn(
                        "absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-200",
                        showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                        {onSetDefault && !isDefault && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={onSetDefault}
                                disabled={isSettingDefault}
                                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                            >
                                {isSettingDefault ? (
                                    <span className="animate-spin mr-2">⏳</span>
                                ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                )}
                                Set Default
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="bg-red-500/80 hover:bg-red-600 text-white border-red-400"
                            >
                                {isDeleting ? (
                                    <span className="animate-spin mr-2">⏳</span>
                                ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Remove
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function AddPaymentMethodCard({ onAdd, isLoading }: { onAdd: () => void; isLoading: boolean }) {
    return (
        <button
            onClick={onAdd}
            disabled={isLoading}
            className={cn(
                "w-full h-44 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700",
                "bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800",
                "hover:border-[rgb(var(--brand-primary))] hover:bg-zinc-100 dark:hover:bg-zinc-800",
                "transition-all duration-300 group cursor-pointer",
                "flex flex-col items-center justify-center gap-3"
            )}
        >
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-700 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-zinc-200 dark:border-zinc-600">
                {isLoading ? (
                    <span className="animate-spin text-xl">⏳</span>
                ) : (
                    <Plus className="h-7 w-7 text-zinc-400 group-hover:text-[rgb(var(--brand-primary))] transition-colors" />
                )}
            </div>
            <div className="text-center">
                <p className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-[rgb(var(--brand-primary))] transition-colors">
                    Add Payment Method
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                    Credit or debit card
                </p>
            </div>
        </button>
    );
}

function PaymentMethodsSection() {
    const { data: paymentMethods, isLoading } = usePaymentMethods();
    const { mutate: createCheckout, isPending: isCreating } = useCreateCheckoutSession();
    const { mutate: setDefault, isPending: isSettingDefault, variables: settingDefaultId } = useSetDefaultPaymentMethod();
    const { mutate: deleteMethod, isPending: isDeleting, variables: deletingId } = useDeletePaymentMethod();

    const handleAddPaymentMethod = () => {
        const returnUrl = window.location.href;
        createCheckout(returnUrl);
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-44 rounded-2xl" />
                <Skeleton className="h-44 rounded-2xl" />
                <Skeleton className="h-44 rounded-2xl opacity-50" />
            </div>
        );
    }

    const hasPaymentMethods = paymentMethods && paymentMethods.length > 0;

    if (!hasPaymentMethods) {
        return (
            <div className="relative p-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)] pointer-events-none" />
                <div className="relative">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-white dark:bg-zinc-800 shadow-lg flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-700">
                        <CreditCard className="h-10 w-10 text-zinc-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                        No Payment Methods
                    </h4>
                    <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
                        Add a payment method to enable automatic billing and ensure uninterrupted service
                    </p>
                    <Button onClick={handleAddPaymentMethod} isLoading={isCreating} size="lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Card
                    </Button>
                </div>
            </div>
        );
    }

    // Sort payment methods: default first, then by creation date
    const sortedMethods = [...paymentMethods].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMethods.map((method) => (
                    <SinglePaymentCard
                        key={method.id}
                        paymentMethod={method}
                        isDefault={method.is_default}
                        onSetDefault={() => setDefault(method.id)}
                        onDelete={() => deleteMethod(method.id)}
                        isSettingDefault={isSettingDefault && settingDefaultId === method.id}
                        isDeleting={isDeleting && deletingId === method.id}
                    />
                ))}
                <AddPaymentMethodCard onAdd={handleAddPaymentMethod} isLoading={isCreating} />
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-2 mt-4">
                <ShieldCheck className="h-4 w-4" />
                Your payment information is encrypted and securely stored. We never store your full card number.
            </p>
        </div>
    );
}

function FormSection({
    title,
    description,
    icon: Icon,
    children
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    children: React.ReactNode;
}) {
    return (
        <div className="relative">
            <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
                </div>
            </div>
            <div className="pl-14">
                {children}
            </div>
        </div>
    );
}

function FormField({
    label,
    error,
    hint,
    children,
    optional = false,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
    optional?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                {label}
                {optional && <span className="text-xs text-zinc-400 font-normal">(Optional)</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
            {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
        </div>
    );
}

export function BillingSettingsSection() {
    const { data: billingSettings, isLoading } = useBillingSettings();
    const { mutate: updateSettings, isPending, fieldErrors, error } = useUpdateBillingSettings();

    const [formState, setFormState] = useState<BillingFormState>({
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
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize form with current settings
    useEffect(() => {
        if (billingSettings) {
            setFormState({
                billing_email: billingSettings.billing_email || "",
                billing_name: billingSettings.billing_name || "",
                address_line1: billingSettings.address_line1 || "",
                address_line2: billingSettings.address_line2 || "",
                city: billingSettings.city || "",
                state: billingSettings.state || "",
                postal_code: billingSettings.postal_code || "",
                country: billingSettings.country || "",
                tax_id: billingSettings.tax_id || "",
            });
        }
    }, [billingSettings]);

    const handleInputChange = (field: keyof BillingFormState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        updateSettings(formState, {
            onSuccess: () => setHasChanges(false),
        });
    };

    // Calculate completion percentage
    const completionPercentage = useMemo(() => {
        const fields = [
            formState.billing_email,
            formState.billing_name,
            formState.address_line1,
            formState.city,
            formState.state,
            formState.postal_code,
            formState.country,
        ];
        const filled = fields.filter(Boolean).length;
        return Math.round((filled / fields.length) * 100);
    }, [formState]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-40 w-full rounded-2xl" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Payment Method */}
            <Card className="overflow-hidden">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                                    <CreditCard className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                                </div>
                                Payment Method
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Securely manage your payment information
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-xs font-medium">256-bit SSL</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <PaymentMethodsSection />
                </CardContent>
            </Card>

            {/* Billing Information */}
            <Card className="overflow-hidden">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                                </div>
                                Billing Information
                            </CardTitle>
                            <CardDescription className="mt-1">
                                This information will appear on your invoices and receipts
                            </CardDescription>
                        </div>
                        {/* Completion indicator */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className="text-xs text-zinc-500">Profile Completion</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                completionPercentage === 100
                                                    ? "bg-green-500"
                                                    : "bg-[rgb(var(--brand-primary))]"
                                            )}
                                            style={{ width: `${completionPercentage}%` }}
                                        />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-semibold",
                                        completionPercentage === 100
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-zinc-700 dark:text-zinc-300"
                                    )}>
                                        {completionPercentage}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-6">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error saving settings</p>
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8">
                        {/* Contact Information */}
                        <FormSection
                            title="Contact Information"
                            description="Primary billing contact details"
                            icon={Mail}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    label="Billing Email"
                                    error={fieldErrors.billing_email}
                                    hint="Invoices will be sent to this address"
                                >
                                    <Input
                                        type="email"
                                        placeholder="billing@company.com"
                                        value={formState.billing_email}
                                        onChange={(e) => handleInputChange("billing_email", e.target.value)}
                                        className={cn(
                                            "h-11",
                                            fieldErrors.billing_email && "border-red-500 focus:ring-red-500"
                                        )}
                                    />
                                </FormField>
                                <FormField
                                    label="Company / Full Name"
                                    error={fieldErrors.billing_name}
                                >
                                    <Input
                                        type="text"
                                        placeholder="Acme Corporation"
                                        value={formState.billing_name}
                                        onChange={(e) => handleInputChange("billing_name", e.target.value)}
                                        className={cn(
                                            "h-11",
                                            fieldErrors.billing_name && "border-red-500 focus:ring-red-500"
                                        )}
                                    />
                                </FormField>
                            </div>
                        </FormSection>

                        <div className="border-t border-zinc-100 dark:border-zinc-800" />

                        {/* Billing Address */}
                        <FormSection
                            title="Billing Address"
                            description="Legal address for tax and invoicing purposes"
                            icon={MapPin}
                        >
                            <div className="space-y-4">
                                {/* Street Address */}
                                <FormField
                                    label="Street Address"
                                    error={fieldErrors.address_line1}
                                >
                                    <Input
                                        type="text"
                                        placeholder="123 Business Avenue"
                                        value={formState.address_line1}
                                        onChange={(e) => handleInputChange("address_line1", e.target.value)}
                                        className={cn(
                                            "h-11",
                                            fieldErrors.billing_address_line1 && "border-red-500 focus:ring-red-500"
                                        )}
                                    />
                                </FormField>

                                <FormField
                                    label="Apartment, suite, unit, etc."
                                    optional
                                >
                                    <Input
                                        type="text"
                                        placeholder="Suite 400"
                                        value={formState.address_line2}
                                        onChange={(e) => handleInputChange("address_line2", e.target.value)}
                                        className="h-11"
                                    />
                                </FormField>

                                {/* City and State/Province */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        label="City"
                                        error={fieldErrors.billing_city}
                                    >
                                        <Input
                                            type="text"
                                            placeholder="San Francisco"
                                            value={formState.city}
                                            onChange={(e) => handleInputChange("city", e.target.value)}
                                            className={cn(
                                                "h-11",
                                                fieldErrors.city && "border-red-500 focus:ring-red-500"
                                            )}
                                        />
                                    </FormField>
                                    <FormField
                                        label="State / Province / Region"
                                        error={fieldErrors.state}
                                    >
                                        <Input
                                            type="text"
                                            placeholder="California"
                                            value={formState.state}
                                            onChange={(e) => handleInputChange("state", e.target.value)}
                                            className={cn(
                                                "h-11",
                                                fieldErrors.state && "border-red-500 focus:ring-red-500"
                                            )}
                                        />
                                    </FormField>
                                </div>

                                {/* Postal Code and Country */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        label="Postal / ZIP Code"
                                        error={fieldErrors.postal_code}
                                    >
                                        <Input
                                            type="text"
                                            placeholder="94102"
                                            value={formState.postal_code}
                                            onChange={(e) => handleInputChange("postal_code", e.target.value)}
                                            className={cn(
                                                "h-11",
                                                fieldErrors.postal_code && "border-red-500 focus:ring-red-500"
                                            )}
                                        />
                                    </FormField>
                                    <FormField
                                        label="Country"
                                        error={fieldErrors.country}
                                    >
                                        <div className="relative">
                                            <select
                                                value={formState.country}
                                                onChange={(e) => handleInputChange("country", e.target.value)}
                                                className={cn(
                                                    "w-full h-11 pl-10 pr-4 rounded-md border border-zinc-300 dark:border-zinc-700",
                                                    "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
                                                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))] focus:border-transparent",
                                                    "appearance-none cursor-pointer",
                                                    fieldErrors.country && "border-red-500 focus:ring-red-500"
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
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </FormField>
                                </div>
                            </div>
                        </FormSection>

                        <div className="border-t border-zinc-100 dark:border-zinc-800" />

                        {/* Tax Information */}
                        <FormSection
                            title="Tax Information"
                            description="For tax exemption and compliance"
                            icon={Hash}
                        >
                            <div className="max-w-md">
                                <FormField
                                    label="Tax ID / VAT Number"
                                    error={fieldErrors.tax_id}
                                    hint="Enter your business tax identification number for invoice compliance"
                                    optional
                                >
                                    <Input
                                        type="text"
                                        placeholder="US 12-3456789 or GB 123456789"
                                        value={formState.tax_id}
                                        onChange={(e) => handleInputChange("tax_id", e.target.value)}
                                        className={cn(
                                            "h-11 font-mono",
                                            fieldErrors.tax_id && "border-red-500 focus:ring-red-500"
                                        )}
                                    />
                                </FormField>
                            </div>
                        </FormSection>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-6 mt-8 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <ShieldCheck className="h-4 w-4" />
                            Your information is encrypted and secure
                        </div>
                        <div className="flex items-center gap-3">
                            {hasChanges && (
                                <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <Sparkles className="h-4 w-4" />
                                    Unsaved changes
                                </span>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={!hasChanges || isPending}
                                isLoading={isPending}
                                size="lg"
                            >
                                {!isPending && <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
