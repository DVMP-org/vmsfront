import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";

/** Inline details beside a register, stacking below it on narrow screens. */
export function DetailPanel({
  title,
  description,
  onClose,
  children,
  className,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`sticky top-4 min-h-[min(780px,calc(100vh-2rem))] self-start ${className || ""}`}
      role="region"
      aria-label={`${title} details`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--vms-line)] p-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              {description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close details"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {children}
    </Card>
  );
}
