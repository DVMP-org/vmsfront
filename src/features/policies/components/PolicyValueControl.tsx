"use client";

import { cn } from "@/lib/utils";

import type { PolicyEntry, PolicyValue } from "../api";
import { numericBound, toNumericInput } from "../lib";

type PolicyControlDefinition = Pick<
    PolicyEntry,
    | "key"
    | "name"
    | "description"
    | "value_type"
    | "options"
    | "minimum"
    | "maximum"
    | "unit"
>;

/**
 * One typed control for a policy. The definition's `value_type` decides the
 * control, so a new policy appears with a usable editor without a bespoke form.
 */
export function PolicyValueControl({
    policy,
    value,
    onChange,
    disabled = false,
}: {
    policy: PolicyControlDefinition;
    value: PolicyValue;
    onChange: (value: PolicyValue) => void;
    disabled?: boolean;
}) {
    if (policy.value_type === "boolean") {
        const checked = value === true;
        return (
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={policy.name}
                    disabled={disabled}
                    onClick={() => onChange(!checked)}
                    className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] disabled:opacity-60",
                        checked
                            ? "border-[var(--vms-active-accent)] bg-[var(--vms-active-accent)]"
                            : "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]",
                    )}
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                            checked ? "translate-x-6" : "translate-x-1",
                        )}
                    />
                </button>
                <span className="text-xs font-medium text-[var(--vms-ink-muted)]">
                    {checked ? "Yes" : "No"}
                </span>
            </div>
        );
    }

    if (policy.value_type === "enum") {
        return (
            <select
                aria-label={policy.name}
                disabled={disabled}
                value={String(value ?? "")}
                onChange={(event) => {
                    const option = policy.options.find(
                        (item) => String(item.value) === event.target.value,
                    );
                    onChange(option ? option.value : event.target.value);
                }}
                className="min-h-11 w-full max-w-sm rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] disabled:opacity-60"
            >
                {policy.options.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }

    if (policy.value_type === "time_window") {
        const window = (value ?? {}) as {
            start?: string;
            end?: string;
            days?: number[];
        };
        return (
            <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`${policy.key}-start`}>
                    Start time
                </label>
                <input
                    id={`${policy.key}-start`}
                    type="time"
                    disabled={disabled}
                    value={window.start ?? ""}
                    onChange={(event) =>
                        onChange({
                            start: event.target.value,
                            end: window.end ?? "",
                            days: window.days ?? [],
                        })
                    }
                    className="min-h-11 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm"
                />
                <span aria-hidden="true" className="text-[var(--vms-ink-muted)]">
                    to
                </span>
                <label className="sr-only" htmlFor={`${policy.key}-end`}>
                    End time
                </label>
                <input
                    id={`${policy.key}-end`}
                    type="time"
                    disabled={disabled}
                    value={window.end ?? ""}
                    onChange={(event) =>
                        onChange({
                            start: window.start ?? "",
                            end: event.target.value,
                            days: window.days ?? [],
                        })
                    }
                    className="min-h-11 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm"
                />
            </div>
        );
    }

    const step = policy.value_type === "integer" ? 1 : 0.01;
    const suffix = policy.unit ? (
        <span className="text-xs text-[var(--vms-ink-muted)]">{policy.unit}</span>
    ) : null;
    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                aria-label={policy.name}
                disabled={disabled}
                min={numericBound(policy, "minimum")}
                max={numericBound(policy, "maximum")}
                step={step}
                value={toNumericInput(value)}
                onChange={(event) => {
                    const next = event.target.value;
                    onChange(next === "" ? 0 : Number(next));
                }}
                className="min-h-11 w-32 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] disabled:opacity-60"
            />
            {suffix}
        </div>
    );
}
