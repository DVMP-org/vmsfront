import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PluginMetric {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: LucideIcon;
}

export function PluginMetricStrip({
  metrics,
  label = "Plugin metrics",
}: {
  metrics: PluginMetric[];
  label?: string;
}) {
  return (
    <dl
      aria-label={label}
      className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={cn(
              "min-w-0 p-4",
              index > 0 && "border-t border-[var(--vms-line)]",
              index % 2 === 1 && "sm:border-l",
              index >= 2 && "sm:border-t",
              "xl:border-l xl:border-t-0 xl:first:border-l-0",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                {metric.label}
              </dt>
              {Icon ? (
                <Icon
                  className="h-4 w-4 text-[var(--vms-ink-muted)]"
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <dd className="mt-2 text-2xl font-semibold tabular-nums text-[var(--vms-ink)]">
              {metric.value}
            </dd>
            {metric.detail ? (
              <dd className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                {metric.detail}
              </dd>
            ) : null}
          </div>
        );
      })}
    </dl>
  );
}

type NoticeTone = "info" | "success" | "warning" | "danger";

const noticeTone: Record<NoticeTone, string> = {
  info: "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
  success:
    "border-[color-mix(in_srgb,var(--vms-success)_32%,white)] bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
  warning:
    "border-[color-mix(in_srgb,var(--vms-warning)_32%,white)] bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]",
  danger:
    "border-[color-mix(in_srgb,var(--vms-danger)_32%,white)] bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]",
};

export function PluginNotice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: NoticeTone;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border p-4 sm:flex-row sm:items-start sm:justify-between",
        noticeTone[tone],
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {children ? (
          <div className="mt-1 text-sm leading-5 opacity-90">{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}
