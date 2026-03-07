"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    useCurrentSubscription,

    useUpdateSubscription,
    useCancelSubscription,
    useReactivateSubscription,
} from "@/hooks/use-subscription";
import { useCurrentOrganization, usePlans } from "@/hooks/use-organization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    Crown,
    Calendar,
    CreditCard,
    AlertTriangle,
    ArrowRight,
    Check,
    X,
    Zap,
    RefreshCw,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionStatus, Plan } from "@/types/subscription";

function formatDateShort(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateLong(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price);
}


function StatusBadge({ status }: { status: SubscriptionStatus }) {
    const config = {
        [SubscriptionStatus.ACTIVE]: { label: "Active", variant: "success" as const },
        [SubscriptionStatus.PAST_DUE]: { label: "Past Due", variant: "warning" as const },
        [SubscriptionStatus.CANCELED]: { label: "Canceled", variant: "danger" as const },
    };

    const { label, variant } = config[status] || { label: status, variant: "default" as const };

    return <Badge variant={variant}>{label}</Badge>;
}

function ChangePlanModal({
    isOpen,
    onClose,
    currentPlanId,
    currentBillingCycle,
}: {
    isOpen: boolean;
    onClose: () => void;
    currentPlanId: string;
    currentBillingCycle: string;
}) {
    const { data: plans, isLoading } = usePlans();
    const { mutate: updateSubscription, isPending } = useUpdateSubscription();
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
        currentBillingCycle as "monthly" | "yearly"
    );

    const activePlans = plans?.filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order) || [];

    const handleChangePlan = () => {
        if (!selectedPlanId) return;
        updateSubscription(
            { plan_id: selectedPlanId, billing_cycle: billingCycle },
            { onSuccess: onClose }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Plan">
            <div className="space-y-6">
                {/* Billing Cycle Toggle */}
                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                billingCycle === "monthly"
                                    ? "bg-white dark:bg-zinc-900 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                billingCycle === "yearly"
                                    ? "bg-white dark:bg-zinc-900 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            Yearly
                        </button>
                    </div>
                </div>

                {/* Plans */}
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {activePlans.map((plan) => {
                            const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
                            const isCurrentPlan = plan.id === currentPlanId;
                            const isSelected = plan.id === selectedPlanId;

                            return (
                                <button
                                    key={plan.id}
                                    onClick={() => !isCurrentPlan && setSelectedPlanId(plan.id)}
                                    disabled={isCurrentPlan}
                                    className={cn(
                                        "w-full p-4 rounded-lg border-2 text-left transition-all",
                                        isCurrentPlan
                                            ? "border-zinc-200 bg-zinc-50 dark:bg-zinc-800/50 cursor-not-allowed opacity-60"
                                            : isSelected
                                                ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]/5"
                                                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                                                    {plan.name}
                                                </span>
                                                {isCurrentPlan && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                            {plan.description && (
                                                <p className="text-sm text-zinc-500 mt-1">{plan.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                                                {formatPrice(price)}
                                            </span>
                                            <span className="text-sm text-zinc-500">
                                                /{billingCycle === "monthly" ? "mo" : "yr"}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleChangePlan}
                        disabled={!selectedPlanId || isPending}
                        isLoading={isPending}
                    >
                        Change Plan
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function CancelSubscriptionModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { mutate: cancelSubscription, isPending } = useCancelSubscription();
    const [cancelImmediately, setCancelImmediately] = useState(false);

    const handleCancel = () => {
        cancelSubscription(cancelImmediately, { onSuccess: onClose });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cancel Subscription">
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-200">
                            Are you sure you want to cancel?
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            You will lose access to premium features when your subscription ends.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <input
                            type="radio"
                            name="cancelType"
                            checked={!cancelImmediately}
                            onChange={() => setCancelImmediately(false)}
                            className="h-4 w-4 text-[rgb(var(--brand-primary))]"
                        />
                        <div>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                Cancel at period end
                            </span>
                            <p className="text-sm text-zinc-500">
                                Keep access until your current billing period ends
                            </p>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <input
                            type="radio"
                            name="cancelType"
                            checked={cancelImmediately}
                            onChange={() => setCancelImmediately(true)}
                            className="h-4 w-4 text-[rgb(var(--brand-primary))]"
                        />
                        <div>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                Cancel immediately
                            </span>
                            <p className="text-sm text-zinc-500">
                                Lose access right away (no refund)
                            </p>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Keep Subscription
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleCancel}
                        isLoading={isPending}
                    >
                        Cancel Subscription
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export function SubscriptionSection() {
    const router = useRouter();
    const { organization } = useCurrentOrganization();
    const { data: subscription, isLoading } = useCurrentSubscription();
    const { mutate: reactivate, isPending: isReactivating } = useReactivateSubscription();
    const [showChangePlanModal, setShowChangePlanModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const hasSubscription = subscription && subscription.status !== SubscriptionStatus.CANCELED;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-32" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // No subscription - show CTA to subscribe
    if (!subscription || !hasSubscription) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center max-w-md mx-auto">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--brand-primary))]/10 mb-6">
                                <Zap className="h-8 w-8 text-[rgb(var(--brand-primary))]" />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                                No Active Subscription
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                                {organization?.name} doesn&apos;t have an active subscription. Subscribe to a plan to
                                unlock all features.
                            </p>
                            <Button onClick={() => router.push("/organizations/plans")} size="lg">
                                <Crown className="mr-2 h-5 w-5" />
                                View Plans
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>

                            {subscription?.status === SubscriptionStatus.CANCELED && !subscription?.cancel_at_period_end && (
                                <div className="mt-6 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                                        Your subscription was cancelled. You can reactivate it to continue where you left off.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => reactivate()}
                                        isLoading={isReactivating}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Reactivate Subscription
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Active subscription
    const plan = subscription.plan;
    const currentPrice =
        subscription.billing_cycle === "yearly" ? plan?.price_yearly : plan?.price_monthly;

    return (
        <div className="space-y-6">
            {/* Current Plan */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3">
                                <Crown className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
                                Current Plan
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Manage your subscription and billing
                            </CardDescription>
                        </div>
                        <StatusBadge status={subscription.status} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Plan Details */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-[rgb(var(--brand-primary))]/5 to-[rgb(var(--brand-primary))]/10 border border-[rgb(var(--brand-primary))]/20">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                                    {plan?.name || "Unknown Plan"}
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                                    {plan?.description}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                                    {currentPrice ? formatPrice(currentPrice) : "—"}
                                </div>
                                <div className="text-sm text-zinc-500">
                                    per {subscription.billing_cycle === "yearly" ? "year" : "month"}
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        {plan?.features && (
                            <div className="mt-4 pt-4 border-t border-[rgb(var(--brand-primary))]/20">
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(plan.features).slice(0, 5).map(([key, value]) => (
                                        <span
                                            key={key}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-300"
                                        >
                                            <Check className="h-3.5 w-3.5 text-green-500" />
                                            {typeof value === "boolean" ? key : `${key}: ${value}`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Billing Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Current Period</span>
                            </div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-50">
                                {subscription.current_period_start && subscription.current_period_end
                                    ? `${formatDateShort(subscription.current_period_start)} - ${formatDateShort(
                                        subscription.current_period_end
                                    )}`
                                    : "—"}
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                                <CreditCard className="h-4 w-4" />
                                <span className="text-sm">Next Billing</span>
                            </div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-50">
                                {subscription.current_period_end
                                    ? formatDateLong(subscription.current_period_end)
                                    : "—"}
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                                <RefreshCw className="h-4 w-4" />
                                <span className="text-sm">Billing Cycle</span>
                            </div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-50 capitalize">
                                {subscription.billing_cycle || "Monthly"}
                            </div>
                        </div>
                    </div>

                    {/* Cancellation Warning */}
                    {subscription.cancel_at_period_end && (
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-amber-800 dark:text-amber-200">
                                    Subscription Ending
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    Your subscription will end on{" "}
                                    {subscription.current_period_end
                                        ? formatDateLong(subscription.current_period_end)
                                        : "the end of the billing period"}
                                    . You can reactivate before then to keep your access.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => reactivate()}
                                isLoading={isReactivating}
                            >
                                Reactivate
                            </Button>
                        </div>
                    )}

                    {/* Trial Info */}
                    {subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date() && (
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-800 dark:text-blue-200">Trial Active</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Your trial ends on {formatDateLong(subscription.trial_ends_at)}. Add a payment
                                    method to continue after the trial.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                        <Button onClick={() => setShowChangePlanModal(true)}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Change Plan
                        </Button>
                        {!subscription.cancel_at_period_end && (
                            <Button variant="outline" onClick={() => setShowCancelModal(true)}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel Subscription
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            <ChangePlanModal
                isOpen={showChangePlanModal}
                onClose={() => setShowChangePlanModal(false)}
                currentPlanId={subscription.plan_id}
                currentBillingCycle={subscription.billing_cycle || "monthly"}
            />
            <CancelSubscriptionModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
            />
        </div>
    );
}
