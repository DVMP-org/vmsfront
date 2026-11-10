import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  metadata?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  metadata,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "border-b border-[var(--vms-line)] pb-5 text-[var(--vms-ink)]",
        className,
      )}
    >
      {breadcrumbs}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.04em] text-[var(--vms-ink)] sm:text-[28px] sm:leading-9">
            {title}
          </h1>
          {description ? (
            <div className="mt-1 max-w-3xl text-[14px] leading-5 text-[var(--vms-ink-muted)]">
              {description}
            </div>
          ) : null}
          {metadata ? <div className="mt-3">{metadata}</div> : null}
        </div>
        {primaryAction || secondaryActions ? (
          <div className="flex flex-wrap items-center gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </header>
  );
}
