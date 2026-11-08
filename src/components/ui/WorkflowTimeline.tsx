import { Check, Circle, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkflowState = "complete" | "current" | "pending" | "error";

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  state: WorkflowState;
}

export function WorkflowTimeline({
  steps,
  label = "Workflow progress",
  className,
}: {
  steps: WorkflowStep[];
  label?: string;
  className?: string;
}) {
  return (
    <ol
      aria-label={label}
      className={cn(
        "grid gap-0 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3",
        className,
      )}
    >
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li
            key={step.id}
            aria-current={step.state === "current" ? "step" : undefined}
            className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 pb-4 last:pb-0"
          >
            {!last ? (
              <span
                aria-hidden="true"
                className="absolute left-[0.84rem] top-6 h-[calc(100%-1rem)] w-px bg-[var(--vms-line)]"
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid h-7 w-7 place-items-center rounded-full border bg-[var(--vms-surface)]",
                step.state === "complete" &&
                  "border-[var(--vms-success)] text-[var(--vms-success)]",
                step.state === "current" &&
                  "border-[var(--vms-active-accent)] text-[var(--vms-focus)] ring-4 ring-[var(--vms-coral-soft)]",
                step.state === "pending" &&
                  "border-[var(--vms-line-strong)] text-[var(--vms-ink-muted)]",
                step.state === "error" &&
                  "border-[var(--vms-danger)] text-[var(--vms-danger)]",
              )}
            >
              {step.state === "complete" ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : step.state === "error" ? (
                <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Circle className="h-3 w-3" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 pt-0.5">
              <span
                className={cn(
                  "block text-sm font-semibold",
                  step.state === "pending"
                    ? "text-[var(--vms-ink-muted)]"
                    : "text-[var(--vms-ink)]",
                )}
              >
                {step.label}
              </span>
              {step.description ? (
                <span className="mt-0.5 block text-xs leading-5 text-[var(--vms-ink-muted)]">
                  {step.description}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
