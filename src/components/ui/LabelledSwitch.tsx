"use client";

import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";

/**
 * A switch with its explanation beside it.
 *
 * `Switch` on its own is only the toggle track: its label and description are
 * accessibility-only, so a bare `<Switch>` reads as an unexplained slider on
 * screen. Any toggle whose meaning is not obvious from the row it sits in should
 * use this instead.
 */
export function LabelledSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-border)] p-3",
        disabled && "opacity-60",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-[var(--vms-ink)]">{label}</p>
        {/* Switch points aria-describedby at this id. */}
        <p
          id={`${id}-description`}
          className="text-xs leading-relaxed text-[var(--vms-ink-muted)]"
        >
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onChange={onChange}
        label={label}
        disabled={disabled}
      />
    </div>
  );
}
