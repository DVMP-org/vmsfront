import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrganizationSetupStep = "organization" | "plan" | "site";

const steps: Array<{ id: OrganizationSetupStep; label: string }> = [
  { id: "organization", label: "Organization" },
  { id: "plan", label: "Plan" },
  { id: "site", label: "First Site" },
];

export function SetupProgress({
  currentStep,
}: {
  currentStep: OrganizationSetupStep;
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <ol
      aria-label="Organization setup progress"
      className="grid gap-2 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-2 sm:grid-cols-3"
    >
      {steps.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li
            key={step.id}
            aria-current={current ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              current &&
                "bg-[var(--vms-surface-subtle)] font-semibold text-[var(--vms-ink)]",
              !current && "text-[var(--vms-ink-muted)]",
            )}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--vms-surface)] text-[10px] ring-1 ring-[var(--vms-line)]">
              {complete ? (
                <Check className="h-3.5 w-3.5 text-[var(--vms-success)]" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
