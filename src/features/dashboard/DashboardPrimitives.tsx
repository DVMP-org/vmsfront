"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ReportPanel({
  eyebrow,
  title,
  titleId,
  description,
  action,
  children,
  className,
  bodyClassName,
  footer,
}: {
  eyebrow?: string;
  title: string;
  titleId?: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "min-w-0 overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]",
        className,
      )}
    >
      <header className="flex min-h-16 items-start justify-between gap-4 border-b border-[var(--vms-line)] px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={titleId}
            className="text-base font-semibold leading-6 text-[var(--vms-ink)]"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-xs leading-5 text-[var(--vms-ink-muted)]">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {bodyClassName ? (
        <div className={bodyClassName}>{children}</div>
      ) : (
        children
      )}
      {footer ? (
        <footer className="border-t border-[var(--vms-line)] px-4 py-3 text-xs text-[var(--vms-ink-muted)] sm:px-5">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

export function PanelState({
  kind,
  title,
  description,
  onRetry,
  isRetrying = false,
  compact = false,
  retryLabel = "Retry",
}: {
  kind: "loading" | "empty" | "error";
  title: string;
  description: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
  retryLabel?: string;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-start justify-center gap-2 px-5",
        compact ? "min-h-32 py-5" : "min-h-64 py-8",
        kind === "error" && "text-[var(--vms-danger)]",
      )}
    >
      <p className="text-sm font-semibold text-[var(--vms-ink)]">{title}</p>
      <p className="max-w-xl text-xs leading-5 text-[var(--vms-ink-muted)]">
        {description}
      </p>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={onRetry}
          isLoading={isRetrying}
        >
          {!isRetrying ? <RefreshCcw className="h-3.5 w-3.5" /> : null}
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function StaleDataBanner({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-warning)_35%,white)] bg-[var(--vms-warning-subtle)] px-4 py-3 text-sm text-[var(--vms-ink)] sm:flex-row sm:items-center sm:justify-between"
    >
      <span>{message}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRetry}
        isLoading={isRetrying}
      >
        Retry
      </Button>
    </div>
  );
}

export function SeeAllLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-8 items-center gap-1 rounded-[var(--vms-radius-control)] px-1 text-xs font-semibold text-[var(--vms-ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading property operations dashboard</span>
      <div className="h-28 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
      <div className="h-24 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
        <div className="h-80 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
        <div className="h-80 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
      </div>
      <div className="h-64 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
    </div>
  );
}
