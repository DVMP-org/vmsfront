import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type ActionCardTone = "coral" | "ink" | "info" | "success" | "warning";

const toneClasses: Record<
  ActionCardTone,
  { icon: string; rail: string; glow: string }
> = {
  coral: {
    icon: "bg-[var(--vms-coral-soft)] text-[var(--vms-coral)]",
    rail: "bg-[var(--vms-coral)]",
    glow: "bg-[color-mix(in_srgb,var(--vms-coral)_10%,transparent)]",
  },
  ink: {
    icon: "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
    rail: "bg-[var(--vms-ink)]",
    glow: "bg-[color-mix(in_srgb,var(--vms-ink)_7%,transparent)]",
  },
  info: {
    icon: "bg-[color-mix(in_srgb,var(--vms-info)_10%,white)] text-[var(--vms-info)]",
    rail: "bg-[var(--vms-info)]",
    glow: "bg-[color-mix(in_srgb,var(--vms-info)_9%,transparent)]",
  },
  success: {
    icon: "bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
    rail: "bg-[var(--vms-success)]",
    glow: "bg-[color-mix(in_srgb,var(--vms-success)_9%,transparent)]",
  },
  warning: {
    icon: "bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]",
    rail: "bg-[var(--vms-warning)]",
    glow: "bg-[color-mix(in_srgb,var(--vms-warning)_9%,transparent)]",
  },
};

export interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  eyebrow?: string;
  meta?: string;
  tone?: ActionCardTone;
  className?: string;
  "aria-label"?: string;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  eyebrow,
  meta,
  tone = "coral",
  className,
  "aria-label": ariaLabel,
}: ActionCardProps) {
  const palette = toneClasses[tone];
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute -right-7 -top-8 h-24 w-24 rounded-full blur-2xl",
          palette.glow,
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-4 left-0 w-[3px] rounded-r-full",
          palette.rail,
        )}
      />
      <span className="relative flex min-w-0 items-start gap-3.5">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-[10px]",
            palette.icon,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          {eyebrow ? (
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
              {eyebrow}
            </span>
          ) : null}
          <span className="block text-[15px] font-semibold leading-5 tracking-[-0.015em] text-[var(--vms-ink)]">
            {title}
          </span>
          <span className="mt-1.5 block text-xs leading-5 text-[var(--vms-ink-muted)]">
            {description}
          </span>
          {meta ? (
            <span className="mt-2 block text-[11px] font-medium text-[var(--vms-ink-muted)]">
              {meta}
            </span>
          ) : null}
        </span>
        <ArrowRight
          aria-hidden="true"
          className="mt-1 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--vms-ink)] motion-reduce:transition-none"
        />
      </span>
    </>
  );
  const classes = cn(
    "group relative flex min-h-[6.4rem] w-full overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 pl-5 text-left",
    "transition-[border-color,background-color] hover:border-[var(--vms-line-strong)] hover:bg-[var(--vms-surface-subtle)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
