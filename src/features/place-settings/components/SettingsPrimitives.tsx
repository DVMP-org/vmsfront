"use client";

import type { ReactNode } from "react";

/**
 * Shared building blocks for the Place settings page.
 *
 * Each settings row is a label, an explanation and one control, so the page
 * reads like a list of decisions instead of a wall of inputs.
 */

export const settingsSurface =
    "rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]";

export function SettingsCard({
    title,
    description,
    action,
    children,
    className,
    bodyClassName,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    return (
        <section className={className ?? settingsSurface}>
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-1 pt-4 sm:px-5 sm:pt-5">
                <div className="min-w-0">
                    <h2 className="text-[17px] font-semibold leading-6 tracking-[-0.01em] text-[var(--vms-ink)]">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                            {description}
                        </p>
                    ) : null}
                </div>
                {action}
            </div>
            <div className={bodyClassName ?? "px-4 pb-4 pt-2 sm:px-5 sm:pb-5"}>
                {children}
            </div>
        </section>
    );
}

export function SettingsRow({
    title,
    description,
    control,
    hint,
    htmlFor,
}: {
    title: string;
    description?: string;
    control: ReactNode;
    hint?: ReactNode;
    htmlFor?: string;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--vms-line)] py-3.5 last:border-b-0">
            <div className="min-w-0 flex-1">
                <label
                    htmlFor={htmlFor}
                    className="block text-sm font-semibold leading-5 text-[var(--vms-ink)]"
                >
                    {title}
                </label>
                {description ? (
                    <p className="mt-0.5 text-xs leading-5 text-[var(--vms-ink-muted)]">
                        {description}
                    </p>
                ) : null}
                {hint ? (
                    <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                        {hint}
                    </p>
                ) : null}
            </div>
            <div className="shrink-0 sm:pl-4">{control}</div>
        </div>
    );
}

export function SettingsSelect({
    value,
    onChange,
    options,
    ariaLabel,
    id,
    shape = "inline",
}: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    ariaLabel: string;
    id?: string;
    /** `inline` sits in a row; `block` fills the row under its label. */
    shape?: "inline" | "block";
}) {
    return (
        <select
            id={id}
            aria-label={ariaLabel}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`min-h-10 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm text-[var(--vms-ink)] transition hover:border-[var(--vms-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] ${shape === "inline" ? "w-auto min-w-[9.5rem]" : "w-full"
                }`}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
