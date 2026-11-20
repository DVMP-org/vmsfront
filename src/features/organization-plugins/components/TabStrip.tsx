"use client";

import { useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
    id: T;
    label: string;
}

/** Accessible tab strip with roving focus and arrow-key navigation. */
export function TabStrip<T extends string>({
    items,
    value,
    onChange,
    label,
    panelId,
    variant = "segmented",
    className,
}: {
    items: Array<TabItem<T>>;
    value: T;
    onChange: (value: T) => void;
    label: string;
    panelId: string;
    variant?: "segmented" | "inline";
    className?: string;
}) {
    const refs = useRef<Array<HTMLButtonElement | null>>([]);

    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        const last = items.length - 1;
        let next: number | null = null;
        if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
        else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = last;
        if (next === null) return;
        event.preventDefault();
        onChange(items[next].id);
        refs.current[next]?.focus();
    };

    return (
        <div
            role="tablist"
            aria-label={label}
            className={cn(
                variant === "segmented"
                    ? "inline-flex rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface-subtle)] p-1"
                    : "flex flex-wrap gap-1",
                className,
            )}
        >
            {items.map((item, index) => {
                const selected = value === item.id;
                return (
                    <button
                        key={item.id}
                        ref={(element) => {
                            refs.current[index] = element;
                        }}
                        type="button"
                        role="tab"
                        id={`${panelId}-tab-${item.id}`}
                        aria-selected={selected}
                        aria-controls={panelId}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onChange(item.id)}
                        onKeyDown={(event) => onKeyDown(event, index)}
                        className={cn(
                            "min-h-9 rounded-[var(--vms-radius-control)] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                            selected
                                ? variant === "segmented"
                                    ? "bg-[var(--vms-surface)] text-[var(--vms-ink)] shadow-sm"
                                    : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]"
                                : "text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
                        )}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
