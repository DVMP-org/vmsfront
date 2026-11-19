"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The single tooltip primitive for the product.
 *
 * Native `title` attributes wait ~1s, cannot be reached by keyboard and are
 * styled by the browser, so they are not a UX tool. Every hint in the product
 * goes through this file instead: one delay, one surface, one focus rule, and
 * a portal so a tooltip inside a scrolling table or clipped card is never cut
 * off.
 *
 * Usage:
 *   <Tooltip content="Explain the control"><Button … /></Tooltip>
 *   <InfoHint content="What this number counts" label="About open charges" />
 */
export const TooltipProvider = TooltipPrimitive.Provider;

/** Default delay: long enough to ignore a passing pointer, short enough to help. */
const DEFAULT_DELAY_MS = 250;

export interface TooltipProps {
    /** Short, plain-language explanation. Keep it to one or two sentences. */
    content: React.ReactNode;
    children: React.ReactElement;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    delayDuration?: number;
    /** Hide the arrow when the tooltip is anchored to dense table controls. */
    hideArrow?: boolean;
}

export function Tooltip({
    content,
    children,
    side = "top",
    align = "center",
    delayDuration = DEFAULT_DELAY_MS,
    hideArrow = false,
}: TooltipProps) {
    if (content === null || content === undefined || content === "") {
        return children;
    }

    return (
        // The provider lives here rather than at the app root so the primitive is
        // safe to render in isolation: a tooltip that throws because a page forgot
        // a provider is worse than a tooltip without shared hover timing.
        <TooltipPrimitive.Provider
            delayDuration={delayDuration}
            skipDelayDuration={300}
        >
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        align={align}
                        sideOffset={6}
                        collisionPadding={8}
                        className="z-[60] max-w-[19rem] rounded-lg bg-[var(--vms-ink)] px-2.5 py-1.5 text-xs font-medium leading-4 text-white shadow-[0_8px_24px_rgb(0_0_0_/_0.18)]"
                    >
                        {content}
                        {hideArrow ? null : (
                            <TooltipPrimitive.Arrow className="fill-[var(--vms-ink)]" />
                        )}
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}

export interface InfoHintProps {
    /** The explanation shown on hover and keyboard focus. */
    content: React.ReactNode;
    /** Accessible name for the trigger; defaults to "More information". */
    label?: string;
    side?: TooltipProps["side"];
    className?: string;
}

/**
 * A small "what is this?" affordance for labels, metric cards and fields.
 *
 * It is a real button so it is reachable by keyboard and announced by screen
 * readers; the tooltip is the visual layer, `label` is the accessible name.
 */
export function InfoHint({
    content,
    label = "More information",
    side = "top",
    className,
}: InfoHintProps) {
    return (
        <Tooltip content={content} side={side}>
            <button
                type="button"
                aria-label={label}
                className={cn(
                    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--vms-ink-muted)] transition-colors hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-1",
                    className,
                )}
            >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
        </Tooltip>
    );
}
