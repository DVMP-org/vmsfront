"use client";

import { cn } from "@/lib/utils";

/**
 * Accessible on/off switch.
 *
 * Uses `role="switch"` with an explicit label so the control is operable by
 * keyboard and announced correctly, and keeps a 44px hit area on touch
 * devices.
 */
export function Switch({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    id,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    /** Accessible name for the control. */
    label: string;
    description?: string;
    disabled?: boolean;
    id?: string;
}) {
    const descriptionId = id ? `${id}-description` : undefined;
    return (
        <button
            type="button"
            id={id}
            role="switch"
            aria-checked={checked}
            aria-label={label}
            aria-describedby={descriptionId}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2",
                checked
                    ? "bg-[var(--vms-ink)]"
                    : "bg-[var(--vms-line-strong)] hover:bg-[var(--vms-ink-muted)]",
                disabled && "cursor-not-allowed opacity-50",
                "[@media(pointer:coarse)]:min-h-11",
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-150",
                    checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
                )}
            />
        </button>
    );
}
