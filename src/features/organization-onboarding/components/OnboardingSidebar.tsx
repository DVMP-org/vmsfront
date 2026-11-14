import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import {
    ONBOARDING_STEPS,
    onboardingStepState,
    type OnboardingStepId,
} from "../lib";

const STATE_LABEL = {
    complete: "Done",
    current: "Now",
    upcoming: "Next",
} as const;

/**
 * Right-hand explanation of the whole flow. Every step can reuse it so the
 * same three sentences describe setup everywhere.
 */
export function OnboardingSidebar({
    current,
    heading = "How setup works",
    footer,
}: {
    current: OnboardingStepId;
    heading?: string;
    footer?: React.ReactNode;
}) {
    return (
        <section
            aria-labelledby="onboarding-sidebar-title"
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
        >
            <h2
                id="onboarding-sidebar-title"
                className="text-sm font-semibold text-[var(--vms-ink)]"
            >
                {heading}
            </h2>
            <ol className="mt-4 space-y-4">
                {ONBOARDING_STEPS.map((step, index) => {
                    const state = onboardingStepState(step.id, current);
                    return (
                        <li key={step.id} className="flex gap-3">
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums",
                                    state === "complete" &&
                                    "bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
                                    state === "current" &&
                                    "bg-[var(--vms-action)] text-[var(--vms-on-action)]",
                                    state === "upcoming" &&
                                    "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]",
                                )}
                            >
                                {state === "complete" ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <div className="min-w-0">
                                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                    <span
                                        className={cn(
                                            "font-medium",
                                            state === "upcoming"
                                                ? "text-[var(--vms-ink-muted)]"
                                                : "text-[var(--vms-ink)]",
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                    <span
                                        className={cn(
                                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                                            state === "complete" &&
                                            "bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
                                            state === "current" &&
                                            "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
                                            state === "upcoming" &&
                                            "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]",
                                        )}
                                    >
                                        {STATE_LABEL[state]}
                                    </span>
                                </p>
                                <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                                    {state === "complete" ? step.outcome : step.action}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
            {footer ? (
                <div className="mt-5 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-3 text-xs leading-5 text-[var(--vms-ink-muted)]">
                    {footer}
                </div>
            ) : null}
        </section>
    );
}
