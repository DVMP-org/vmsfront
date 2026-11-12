"use client";

import { ArrowRight, Check, Crown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { Plan } from "@/types/subscription";

import {
    planFeatureEntries,
    planMonthlyEquivalent,
    planPriceFor,
    planSavingsPercent,
    type BillingCycle,
} from "../lib";

/** One sellable plan, priced for the cycle the person has selected. */
export function PlanCard({
    plan,
    billingCycle,
    isSelected,
    isPopular = false,
    isLoading = false,
    onSelect,
}: {
    plan: Plan;
    billingCycle: BillingCycle;
    isSelected: boolean;
    isPopular?: boolean;
    isLoading?: boolean;
    onSelect: () => void;
}) {
    const price = planPriceFor(plan, billingCycle);
    const monthly = planMonthlyEquivalent(plan, billingCycle);
    const savings = planSavingsPercent(plan);
    const features = planFeatureEntries(plan);
    const nameId = `plan-${plan.id}-name`;

    return (
        <div
            className={
                isSelected
                    ? "relative flex flex-col rounded-[var(--vms-radius-surface)] border border-[var(--vms-action)] bg-[var(--vms-surface)] p-5 shadow-[0_0_0_1px_var(--vms-action)]"
                    : "relative flex flex-col rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 transition hover:border-[var(--vms-ink-muted)]"
            }
            aria-labelledby={nameId}
        >
            {isPopular ? (
                <span className="absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full bg-[var(--vms-action)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-on-action)]">
                    <Crown className="h-3 w-3" aria-hidden="true" />
                    Most popular
                </span>
            ) : null}

            <div className="mb-4">
                <h3
                    id={nameId}
                    className="text-lg font-semibold tracking-[-0.01em] text-[var(--vms-ink)]"
                >
                    {plan.name}
                </h3>
                {plan.description ? (
                    <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                        {plan.description}
                    </p>
                ) : null}
            </div>

            <div className="mb-5">
                <p className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums text-[var(--vms-ink)]">
                        {formatPrice(monthly)}
                    </span>
                    <span className="text-sm text-[var(--vms-ink-muted)]">
                        {price > 0 ? "/month" : "forever"}
                    </span>
                </p>
                {billingCycle === "yearly" && price > 0 ? (
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
                        {formatPrice(price)} billed annually
                        {savings > 0 ? (
                            <span className="rounded-full bg-[var(--vms-success-subtle)] px-2 py-0.5 font-semibold text-[var(--vms-success)]">
                                Save {savings}%
                            </span>
                        ) : null}
                    </p>
                ) : null}
                {plan.trial_days && plan.trial_days > 0 ? (
                    <p className="mt-2 text-xs font-semibold text-[var(--vms-action)]">
                        {plan.trial_days}-day free trial
                    </p>
                ) : null}
            </div>

            <ul className="mb-6 flex-1 space-y-2.5">
                {features.length ? (
                    features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                            <Check
                                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-success)]"
                                aria-hidden="true"
                            />
                            <span className="leading-5 text-[var(--vms-ink-muted)]">
                                {feature}
                            </span>
                        </li>
                    ))
                ) : (
                    <li className="text-sm leading-5 text-[var(--vms-ink-muted)]">
                        Every core organization capability for this Site.
                    </li>
                )}
            </ul>

            <Button
                type="button"
                onClick={onSelect}
                variant={isSelected ? "primary" : "outline"}
                className="w-full"
                disabled={isLoading}
                aria-pressed={isSelected}
            >
                {isLoading ? (
                    <Loader2
                        className="h-4 w-4 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                    />
                ) : isSelected ? (
                    <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Selected
                    </>
                ) : (
                    <>
                        Choose {plan.name}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                )}
            </Button>
        </div>
    );
}
