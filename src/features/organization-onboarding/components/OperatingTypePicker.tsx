"use client";

import { Building2, Check, Home, Hotel, Layers, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { UseCase } from "@/features/context/api";

import type { OperatingTypeProfile } from "../lib";

const TYPE_ICONS: Record<UseCase, LucideIcon> = {
    residential: Home,
    commercial: Building2,
    hospitality: Hotel,
    mixed_use: Layers,
};

/**
 * Operating type chosen as cards rather than a select, because the choice sets
 * the capabilities the Site will own for good and people need to compare them.
 */
export function OperatingTypePicker({
    profiles,
    value,
    onChange,
    disabled = false,
    loading = false,
    error,
}: {
    profiles: OperatingTypeProfile[];
    value: UseCase | "";
    onChange: (value: UseCase) => void;
    disabled?: boolean;
    loading?: boolean;
    error?: string;
}) {
    const errorId = "first-site-use-case-error";

    return (
        <fieldset
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            className="min-w-0"
        >
            <legend className="text-[13px] font-semibold leading-[18px] text-[var(--vms-ink)]">
                Operating type
                <span aria-hidden="true" className="ml-0.5 text-[var(--vms-danger)]">
                    *
                </span>
                <span className="sr-only"> (required)</span>
            </legend>
            <p className="mt-1 text-xs leading-[18px] text-[var(--vms-ink-muted)]">
                The Site owns this operating type and every Place under it inherits it.
                Choose the closest fit once — it cannot be changed later.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {profiles.map((profile) => {
                    const Icon = TYPE_ICONS[profile.value] ?? Building2;
                    const selected = value === profile.value;
                    return (
                        <label
                            key={profile.value}
                            data-selected={selected ? "true" : undefined}
                            className={cn(
                                "group relative flex cursor-pointer flex-col gap-2 rounded-[var(--vms-radius-control)] border bg-[var(--vms-surface)] p-4 transition",
                                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--vms-focus)] has-[:focus-visible]:ring-offset-2",
                                selected
                                    ? "border-[var(--vms-action)] shadow-[0_0_0_1px_var(--vms-action)]"
                                    : "border-[var(--vms-line)] hover:border-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)]",
                                disabled && "cursor-not-allowed opacity-60",
                            )}
                        >
                            <input
                                type="radio"
                                name="first-site-use-case"
                                value={profile.value}
                                checked={selected}
                                onChange={() => onChange(profile.value)}
                                disabled={disabled}
                                className="sr-only"
                            />
                            <span className="flex items-start gap-3">
                                <span
                                    className={cn(
                                        "grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)]",
                                        selected
                                            ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                                            : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)] group-hover:text-[var(--vms-ink)]",
                                    )}
                                >
                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-[var(--vms-ink)]">
                                            {profile.label}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                                                selected
                                                    ? "border-[var(--vms-action)] bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                                                    : "border-[var(--vms-line-strong)]",
                                            )}
                                        >
                                            {selected ? <Check className="h-2.5 w-2.5" /> : null}
                                        </span>
                                    </span>
                                    <span className="mt-1 block text-xs leading-5 text-[var(--vms-ink-muted)]">
                                        {profile.tagline}
                                    </span>
                                </span>
                            </span>

                            <span className="flex flex-wrap gap-1.5">
                                {profile.highlights.map((highlight) => (
                                    <span
                                        key={highlight}
                                        className="rounded-full bg-[var(--vms-surface-subtle)] px-2 py-1 text-[11px] font-medium leading-none text-[var(--vms-ink-muted)]"
                                    >
                                        {highlight}
                                    </span>
                                ))}
                            </span>

                            {profile.examples ? (
                                <span className="text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                                    Typical: {profile.examples}
                                </span>
                            ) : null}
                        </label>
                    );
                })}
            </div>

            {loading ? (
                <p className="mt-3 flex items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
                    <Loader2
                        className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                    />
                    Loading operating types from the catalogue…
                </p>
            ) : null}

            {error ? (
                <p
                    id={errorId}
                    className="mt-3 text-xs font-medium leading-[18px] text-[var(--vms-danger)]"
                >
                    {error}
                </p>
            ) : null}
        </fieldset>
    );
}
