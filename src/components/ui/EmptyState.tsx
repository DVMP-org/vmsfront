import type { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
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
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section className="flex min-h-48 flex-col items-center justify-center px-4 py-10 text-center text-[var(--vms-ink)]">
      {Icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]">
          <Icon
            className="h-5 w-5 text-[var(--vms-ink-muted)]"
            aria-hidden="true"
          />
        </div>
      )}
      <h3 className="mb-2 text-base font-semibold leading-6">
        {title}
      </h3>
      {description && (
        <div className="mb-5 max-w-md text-sm leading-5 text-[var(--vms-ink-muted)]">
          {description}
        </div>
      )}
      {action && typeof action === "object" && "label" in action ? (
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      ) : (
        action
      )}
    </section>
  );
}

