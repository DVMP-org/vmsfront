"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { InfoHint } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export interface MetricDefinition {
  label: string;
  value: number | string;
  detail: string;
  /** How the number is derived, when the detail line is not enough. */
  hint?: string;
  href?: string;
  attention?: boolean;
  icon?: LucideIcon;
  state?: "ready" | "loading" | "error";
}

const columns: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
};

export function MetricStrip({
  metrics,
  label = "Property operating metrics",
}: {
  metrics: MetricDefinition[];
  label?: string;
}) {
  if (!metrics.length) return null;

  return (
    <section
      aria-label={label}
      className={cn(
        "grid gap-px overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-line)]",
        columns[Math.min(metrics.length, 6)],
      )}
    >
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const state = metric.state ?? "ready";
        const content = (
          <dl aria-busy={state === "loading"}>
            <dt className="flex items-center gap-2 text-xs font-medium leading-5 text-[var(--vms-ink-muted)]">
              {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
              {metric.label}
              {metric.hint ? (
                <InfoHint
                  content={metric.hint}
                  label={`About ${metric.label}`}
                  className="relative z-[1]"
                />
              ) : null}
            </dt>
            <dd className="mt-2 min-h-8 break-words text-[26px] font-semibold leading-8 tracking-[-0.035em] tabular-nums text-[var(--vms-ink)]">
              {state === "loading" ? (
                <>
                  <Skeleton className="h-8 w-24 max-w-full" />
                  <span className="sr-only">Loading {metric.label}</span>
                </>
              ) : state === "error" ? (
                <span className="text-lg tracking-normal">Unavailable</span>
              ) : metric.value}
            </dd>
            <dd
              className={cn(
                "mt-1 text-xs leading-[18px]",
                state === "ready" && metric.attention
                  ? "text-[var(--vms-warning)]"
                  : "text-[var(--vms-ink-muted)]",
              )}
            >
              {state === "loading"
                ? "Loading current data…"
                : state === "error"
                  ? "Could not load this metric."
                  : metric.detail}
            </dd>
          </dl>
        );
        const classes = cn(
          "min-w-0 bg-[var(--vms-surface)] p-4 sm:p-5",
          metrics.length === 5 && index === 4 && "sm:col-span-2 xl:col-span-1",
        );
        return (
          <div
            key={metric.label}
            className={cn(
              classes,
              metric.href &&
              "relative transition-colors hover:bg-[var(--vms-surface-subtle)] motion-reduce:transition-none",
            )}
          >
            {content}
            {metric.href ? (
              // The link is an overlay rather than a wrapper: the hint is a
              // button, and a button inside an anchor is invalid and would
              // navigate when someone only wanted the explanation.
              <Link
                href={metric.href}
                className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)]"
              >
                <span className="sr-only">{metric.label}</span>
              </Link>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
