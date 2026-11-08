import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import {
  OperationsIllustration,
  type OperationsIllustrationVariant,
} from "@/components/illustrations/OperationsIllustration";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

type EmptyStateAction =
  | ReactNode
  | {
      label: string;
      onClick: () => void;
    };

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: EmptyStateAction;
  illustration?: OperationsIllustrationVariant;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration = "generic",
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-52 flex-col items-center justify-center px-4 py-9 text-center text-[var(--vms-ink)]",
        className,
      )}
    >
      <OperationsIllustration
        variant={illustration}
        className="mb-1 max-w-[8.25rem] opacity-95"
      />
      <div className="flex items-center justify-center gap-2">
        {Icon ? (
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        ) : null}
        <h3 className="text-[15px] font-semibold leading-6">{title}</h3>
      </div>
      {description ? (
        <div className="mt-1.5 max-w-md text-sm leading-5 text-[var(--vms-ink-muted)]">
          {description}
        </div>
      ) : null}
      {action ? (
        <div className="mt-4">
          {typeof action === "object" && "label" in action ? (
            <Button onClick={action.onClick} size="md">
              {action.label}
            </Button>
          ) : (
            action
          )}
        </div>
      ) : null}
    </section>
  );
}
