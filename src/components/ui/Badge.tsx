import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "secondary"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default:
    "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
  neutral:
    "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
  info:
    "border-[color-mix(in_srgb,var(--vms-info)_35%,white)] bg-[color-mix(in_srgb,var(--vms-info)_10%,white)] text-[var(--vms-info)]",
  success:
    "border-[color-mix(in_srgb,var(--vms-success)_35%,white)] bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
  warning:
    "border-[color-mix(in_srgb,var(--vms-warning)_35%,white)] bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]",
  danger:
    "border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]",
  secondary:
    "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]",
  outline:
    "border-[var(--vms-line-strong)] bg-transparent text-[var(--vms-ink-muted)]",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex min-h-6 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold leading-4",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";

export { Badge };
