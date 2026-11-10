import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<StatusTone, string> = {
  neutral:
    "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)] ring-[var(--vms-line)]",
  info: "bg-[color-mix(in_srgb,var(--vms-info)_9%,white)] text-[var(--vms-info)] ring-[color-mix(in_srgb,var(--vms-info)_25%,transparent)]",
  success:
    "bg-[var(--vms-success-subtle)] text-[var(--vms-success)] ring-[color-mix(in_srgb,var(--vms-success)_25%,transparent)]",
  warning:
    "bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)] ring-[color-mix(in_srgb,var(--vms-warning)_25%,transparent)]",
  danger:
    "bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)] ring-[color-mix(in_srgb,var(--vms-danger)_25%,transparent)]",

};

export function StatusBadge({
  tone = "neutral",
  children,
  icon,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
