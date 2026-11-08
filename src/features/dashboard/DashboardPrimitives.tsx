"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface MetricDefinition {
  label: string;
  value: number | string;
  detail: string;
  href?: string;
  attention?: boolean;
  icon?: LucideIcon;
}

export function MetricStrip({ metrics }: { metrics: MetricDefinition[] }) {
  return (
    <section
      aria-label="Property operating metrics"
      className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const content = (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold leading-4 text-[var(--vms-ink-muted)]">
                  {metric.label}
                </p>
                <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[var(--vms-ink)]">
                  {metric.value}
                </p>
              </div>
              {Icon ? (
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-[var(--vms-radius-control)]",
                    metric.attention
                      ? "bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]"
                      : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[var(--vms-ink-muted)]">
              {metric.detail}
            </p>
          </>
        );

        const classes = cn(
          "min-w-0 p-4",
          index < metrics.length - 1 &&
            "border-b border-[var(--vms-line)] sm:border-b",
          "sm:[&:nth-child(2n)]:border-l lg:[&:nth-child(2n)]:border-l-0",
          "lg:[&:not(:nth-child(3n))]:border-l lg:[&:nth-child(3n+1)]:border-l-0",
          "xl:border-b-0 xl:border-l xl:first:border-l-0",
          "transition-colors",
        );

        return metric.href ? (
          <Link
            key={metric.label}
            href={metric.href}
            className={cn(
              classes,
              "group hover:bg-[var(--vms-surface-subtle)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)]",
            )}
          >
            {content}
          </Link>
        ) : (
          <div key={metric.label} className={classes}>
            {content}
          </div>
        );
      })}
    </section>
  );
}

export function ReportPanel({
  title,
  description,
  action,
  children,
  className,
  footer,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
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
          <h2 className="text-base font-semibold leading-6 text-[var(--vms-ink)]">
            {title}
          </h2>
          <p className="mt-0.5 text-xs leading-5 text-[var(--vms-ink-muted)]">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
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
}: {
  kind: "loading" | "empty" | "error";
  title: string;
  description: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
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
          Retry
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
