"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CreditCard, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCurrentOrganization, usePlans } from "@/hooks/use-organization";
import {
    useSubscribeToPlan,
    useSubscriptionPaymentStatus,
} from "@/hooks/use-subscription";
import { openPaymentPopup } from "@/lib/payment-popup";
import { cn, formatPrice } from "@/lib/utils";
import { isDirectSubscriptionResponse } from "@/services/subscription-service";
import type { Plan } from "@/types/subscription";

import {
    buildBillingPayload,
    emptyBillingForm,
    planPriceFor,
    planRequiresPayment,
    validateBillingForm,
    type BillingCycle,
    type BillingFormState,
} from "../lib";
import { BillingForm } from "./BillingForm";
import { PlanCard } from "./PlanCard";
import { PlanCardSkeleton } from "./PlanCardSkeleton";

const CYCLES: { value: BillingCycle; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
];

/**
 * Step 2. Plan choice, billing details and activation. Lives outside the page
 * so the page only decides which shell (setup vs standalone) to show.
 */
export function PlanStep({ mode }: { mode: "setup" | "standalone" }) {
    const router = useRouter();
    const { data: plans, isLoading: plansLoading } = usePlans();
    const { organization, isPending: organizationPending } =
        useCurrentOrganization();
    const { mutateAsync: subscribe, isPending: isSubscribing } =
        useSubscribeToPlan();

    const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const [billing, setBilling] = useState<BillingFormState>(emptyBillingForm);
    const [billingErrors, setBillingErrors] = useState<
        Partial<Record<keyof BillingFormState, string>>
    >({});

    const { data: paymentStatus } = useSubscriptionPaymentStatus(paymentReference);

    const activePlans = useMemo(
        () =>
            (plans ?? [])
                .filter((plan) => plan.is_active)
                .sort((a, b) => a.sort_order - b.sort_order),
        [plans],
    );
    const selectedPlan = activePlans.find((plan) => plan.id === selectedPlanId);
    const requiresPayment = planRequiresPayment(selectedPlan, billingCycle);

    const finish = useCallback(() => {
        window.sessionStorage.removeItem("organization-setup-step");
        if (organization?.needs_first_site === true) {
            router.replace("/setup/first-site");
            return;
        }
        router.replace(mode === "setup" ? "/" : "/admin");
    }, [mode, organization?.needs_first_site, router]);

    useEffect(() => {
        if (selectedPlanId || plansLoading || !activePlans.length) return;
        const defaultPlan =
            activePlans.find(
                (plan) => plan.price_monthly === 0 && plan.price_yearly === 0,
            ) ?? activePlans[0];
        if (defaultPlan) setSelectedPlanId(defaultPlan.id);
    }, [activePlans, plansLoading, selectedPlanId]);

    useEffect(() => {
        if (!paymentStatus || !paymentReference) return;
        if (paymentStatus.status === "success") {
            toast.success("Payment successful. Your subscription is active.");
            setPaymentReference(null);
            finish();
        } else if (paymentStatus.status === "failed") {
            toast.error("Payment failed. Please try again.");
            setPaymentReference(null);
        }
    }, [paymentStatus, paymentReference, finish]);

    function handleBillingChange(field: keyof BillingFormState, value: string) {
        setBilling((current) => ({ ...current, [field]: value }));
        setBillingErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    }

    async function handleActivate() {
        if (!selectedPlan) return;

        if (requiresPayment) {
            const errors = validateBillingForm(billing);
            if (Object.keys(errors).length) {
                setBillingErrors(errors);
                toast.error("Fill in the billing details before paying.");
                return;
            }
        }

        const payload = buildBillingPayload(billing);

        try {
            const response = await subscribe({
                plan_id: selectedPlan.id,
                billing_cycle: billingCycle,
                ...(Object.keys(payload).length ? { billing_details: payload } : {}),
            });

            const data = response.data;

            if (isDirectSubscriptionResponse(data)) {
                finish();
                return;
            }

            if (data?.authorization_url && data?.reference) {
                setPaymentReference(data.reference);
                openPaymentPopup(
                    data.authorization_url,
                    data.reference,
                    () => undefined,
                    (message) => {
                        toast.error(message || "Payment cancelled");
                        setPaymentReference(null);
                    },
                );
                return;
            }

            toast.error("Could not start the payment. Try again.");
        } catch (error) {
            console.error("Subscribe error:", error);
        }
    }

    const activationLabel = requiresPayment
        ? "Proceed to payment"
        : mode === "setup"
            ? "Activate and continue"
            : "Activate Free Plan";
    const popularPlanIndex = Math.floor(activePlans.length / 2);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                    role="group"
                    aria-label="Billing cycle"
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface)] p-1"
                >
                    {CYCLES.map((cycle) => {
                        const active = billingCycle === cycle.value;
                        return (
                            <button
                                key={cycle.value}
                                type="button"
                                onClick={() => setBillingCycle(cycle.value)}
                                aria-pressed={active}
                                className={cn(
                                    "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2",
                                    active
                                        ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                                        : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
                                )}
                            >
                                {cycle.label}
                                {cycle.value === "yearly" ? (
                                    <span
                                        className={cn(
                                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
                                            active
                                                ? "bg-white/20 text-[var(--vms-on-action)]"
                                                : "bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
                                        )}
                                    >
                                        Save
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-[var(--vms-ink-muted)]">
                    Prices exclude tax. Change or cancel from organization settings.
                </p>
            </div>

            {plansLoading ? (
                <div
                    role="status"
                    aria-busy="true"
                    aria-label="Loading plans"
                    className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                    <PlanCardSkeleton />
                    <PlanCardSkeleton />
                    <PlanCardSkeleton />
                </div>
            ) : activePlans.length === 0 ? (
                <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-6">
                    <EmptyState
                        icon={Zap}
                        title="No plans are available"
                        description="There are no subscription plans published right now. Check back shortly or contact support."
                    />
                </div>
            ) : (
                <>
                    <div
                        className={cn(
                            "grid gap-5",
                            activePlans.length === 1 && "max-w-md",
                            activePlans.length === 2 && "md:grid-cols-2",
                            activePlans.length >= 3 && "md:grid-cols-2 xl:grid-cols-3",
                        )}
                    >
                        {activePlans.map((plan: Plan, index) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                billingCycle={billingCycle}
                                isSelected={selectedPlanId === plan.id}
                                isPopular={index === popularPlanIndex && activePlans.length > 1}
                                isLoading={isSubscribing && selectedPlanId === plan.id}
                                onSelect={() => setSelectedPlanId(plan.id)}
                            />
                        ))}
                    </div>

                    {requiresPayment && !paymentReference ? (
                        <BillingForm
                            billing={billing}
                            onChange={handleBillingChange}
                            errors={billingErrors}
                        />
                    ) : null}

                    {selectedPlan ? (
                        paymentReference ? (
                            <div className="flex flex-col items-center gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-warning-subtle)] p-6 text-center">
                                <div className="flex items-center gap-3">
                                    <Clock
                                        className="h-5 w-5 text-[var(--vms-warning)]"
                                        aria-hidden="true"
                                    />
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-[var(--vms-ink)]">
                                            Waiting for payment
                                        </p>
                                        <p className="text-xs text-[var(--vms-ink-muted)]">
                                            Finish the transaction in the secure popup. This page
                                            updates by itself.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPaymentReference(null)}
                                >
                                    Cancel payment
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[var(--vms-ink)]">
                                        {requiresPayment
                                            ? `${selectedPlan.name} · ${formatPrice(
                                                planPriceFor(selectedPlan, billingCycle),
                                            )} per ${billingCycle === "monthly" ? "month" : "year"}`
                                            : `${selectedPlan.name} · no card required`}
                                    </p>
                                    <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                                        {requiresPayment
                                            ? "You will be sent to the secure payment page to finish."
                                            : "You can upgrade to a paid plan at any time."}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleActivate}
                                    isLoading={isSubscribing || organizationPending}
                                    loadingLabel="Activating…"
                                    className="shrink-0"
                                >
                                    {requiresPayment ? (
                                        <CreditCard className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <Zap className="h-4 w-4" aria-hidden="true" />
                                    )}
                                    {activationLabel}
                                </Button>
                            </div>
                        )
                    ) : null}
                </>
            )}
        </div>
    );
}
