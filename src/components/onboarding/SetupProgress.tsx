import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrganizationSetupStep = "organization" | "plan" | "workspace";

const steps: Array<{ id: OrganizationSetupStep; label: string }> = [
  { id: "organization", label: "Organization" },
  { id: "plan", label: "Plan" },
  { id: "workspace", label: "Workspace" },
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
      className="grid gap-2 rounded-xl border border-zinc-200/80 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3"
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
                "bg-[rgb(var(--brand-primary,#213928)/0.08)] font-semibold text-zinc-900 dark:bg-emerald-950/30 dark:text-white",
              !current && "text-zinc-500 dark:text-zinc-400",
            )}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] shadow-sm dark:bg-zinc-800">
              {complete ? (
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
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
