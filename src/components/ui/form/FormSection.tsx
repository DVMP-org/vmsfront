import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
}

export function FormSection({
  title,
  description,
  children,
  className,
  icon: Icon,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "grid gap-4 border-t border-[var(--vms-line)] pt-5 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] md:gap-8",
        className,
      )}
    >
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--vms-ink)]">
          {Icon ? (
            <Icon
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
            />
          ) : null}
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs leading-[18px] text-[var(--vms-ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
