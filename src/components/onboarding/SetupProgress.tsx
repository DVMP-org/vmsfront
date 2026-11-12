import { Check } from "lucide-react";

import {
  ONBOARDING_STEPS,
  onboardingStepState,
  type OnboardingStepId,
} from "@/features/organization-onboarding/lib";
import { cn } from "@/lib/utils";

/** Kept for existing imports; the canonical union lives in the feature lib. */
export type OrganizationSetupStep = OnboardingStepId;

const STATE_COPY = {
  complete: "Done",
  current: "In progress",
  upcoming: "Up next",
} as const;

/**
 * Three-step progress rail shared by the organization, plan and first-Site
 * steps. It reports state rather than acting as navigation: the steps are
 * sequential and only the server decides when one is finished.
 */
export function SetupProgress({
  currentStep,
}: {
    currentStep: OnboardingStepId;
  }) {
  return (
    <ol
      aria-label="Organization setup progress"
      className="grid gap-1 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-1.5 sm:grid-cols-3"
    >
      {ONBOARDING_STEPS.map((step, index) => {
        const state = onboardingStepState(step.id, currentStep);
        return (
          <li
            key={step.id}
            aria-current={state === "current" ? "step" : undefined}
            data-state={state}
            className={cn(
              "relative flex items-center gap-2.5 rounded-[var(--vms-radius-control)] px-3 py-2.5",
              state === "current" && "bg-[var(--vms-surface-subtle)]",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums ring-1",
                state === "complete" &&
                "bg-[var(--vms-success-subtle)] text-[var(--vms-success)] ring-[color-mix(in_srgb,var(--vms-success)_30%,transparent)]",
                state === "current" &&
                "bg-[var(--vms-action)] text-[var(--vms-on-action)] ring-transparent",
                state === "upcoming" &&
                "bg-[var(--vms-surface)] text-[var(--vms-ink-muted)] ring-[var(--vms-line)]",
              )}
            >
              {state === "complete" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                  index + 1
              )}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate text-sm",
                  state === "current"
                    ? "font-semibold text-[var(--vms-ink)]"
                    : "font-medium text-[var(--vms-ink-muted)]",
                )}
              >
                {step.label}
              </span>
              <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                {STATE_COPY[state]}
              </span>
            </span>
            {index < ONBOARDING_STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute right-0 top-1/2 hidden h-8 w-px -translate-y-1/2 bg-[var(--vms-line)] sm:block"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
