"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface IntegrationStatusToggleProps {
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
    showLabel?: boolean;
    size?: "sm" | "md";
}

export function IntegrationStatusToggle({
    enabled,
    onToggle,
    disabled = false,
    showLabel = true,
    size = "md",
}: IntegrationStatusToggleProps) {
    const sizeClasses = {
        sm: {
            track: "h-5 w-9",
            thumb: "h-4 w-4",
            translate: "translate-x-4",
        },
        md: {
            track: "h-6 w-11",
            thumb: "h-5 w-5",
            translate: "translate-x-5",
        },
    };

    const sizes = sizeClasses[size];

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={onToggle}
                disabled={disabled}
                className={cn(
                    "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    sizes.track,
                    enabled
                        ? "bg-emerald-500"
                        : "bg-zinc-200 dark:bg-zinc-700"
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform",
                        sizes.thumb,
                        enabled ? sizes.translate : "translate-x-0.5",
                        "mt-0.5"
                    )}
                />
            </button>
            {showLabel && (
                <span
                    className={cn(
                        "text-sm font-medium",
                        enabled ? "text-emerald-600" : "text-muted-foreground"
                    )}
                >
                    {enabled ? "Enabled" : "Disabled"}
                </span>
            )}
        </div>
    );
}
