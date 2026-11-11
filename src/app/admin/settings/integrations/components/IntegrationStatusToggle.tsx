"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface IntegrationStatusToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
  /** Accessible name when no visible label is rendered. */
  label?: string;
}

export function IntegrationStatusToggle({
  enabled,
  onToggle,
  disabled = false,
  showLabel = true,
  size = "md",
  label,
}: IntegrationStatusToggleProps) {
  const sizeClasses = {
    sm: {
      track: "h-5 w-9",
      thumb: "h-4 w-4",
      translate: "translate-x-4",
      offset: "translate-x-0.5",
    },
    md: {
      track: "h-6 w-11",
      thumb: "h-5 w-5",
      translate: "translate-x-5",
      offset: "translate-x-0.5",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={showLabel ? undefined : label}
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors",
          "duration-[var(--vms-motion)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vms-surface)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizes.track,
          enabled
            ? "bg-[var(--vms-success)]"
            : "bg-[var(--vms-line-strong)]",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block rounded-full bg-[var(--vms-surface)] shadow-sm transition-transform",
            "duration-[var(--vms-motion)] motion-reduce:transition-none",
            sizes.thumb,
            enabled ? sizes.translate : sizes.offset,
          )}
        />
      </button>
      {showLabel && (
        <span
          className={cn(
            "text-sm font-medium",
            enabled
              ? "text-[var(--vms-success)]"
              : "text-[var(--vms-ink-muted)]",
          )}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
      )}
    </div>
  );
}
