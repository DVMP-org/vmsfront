"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, MoreVertical } from "lucide-react";

import { cn } from "@/lib/utils";

type ForumPostActionsMenuProps = {
    tone: "admin" | "mine" | "other";
    align?: "left" | "right";
};

const ACTIONS = ["Edit", "Report", "Delete", "Copy link"] as const;

export function ForumPostActionsMenu({
    tone,
    align = "right",
}: ForumPostActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({ opacity: 0 });
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const closeTimeoutRef = useRef<number | null>(null);

    const clearCloseTimeout = () => {
        if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    };

    const scheduleClose = () => {
        clearCloseTimeout();
        closeTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
        }, 120);
    };

    useEffect(() => {
        return () => clearCloseTimeout();
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            const trigger = triggerRef.current;
            if (!trigger) return;

            const rect = trigger.getBoundingClientRect();
            const menuWidth = 176;
            const viewportPadding = 12;
            const proposedLeft = align === "left" ? rect.right - menuWidth : rect.left;
            const left = Math.min(
                Math.max(viewportPadding, proposedLeft),
                window.innerWidth - menuWidth - viewportPadding
            );

            setMenuStyle({
                position: "fixed",
                top: rect.bottom + 10,
                left,
                width: menuWidth,
                zIndex: 70,
            });
        };

        const handlePointerDown = (event: MouseEvent | PointerEvent) => {
            const target = event.target as Node;
            if (
                !triggerRef.current?.contains(target) &&
                !menuRef.current?.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [align, isOpen]);

    const triggerToneClass =
        tone === "admin"
            ? "border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-400/20 dark:text-amber-100 dark:hover:bg-amber-500/10"
            : tone === "mine"
                ? "border-[rgb(var(--brand-primary))]/30 text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary))]/10 dark:text-white dark:hover:bg-white/10"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-border dark:text-zinc-300 dark:hover:bg-zinc-800";

    return (
        <>
            <div
                data-post-actions
                className="relative ml-auto shrink-0"
                onMouseEnter={() => {
                    clearCloseTimeout();
                    setIsOpen(true);
                }}
                onMouseLeave={scheduleClose}
            >
                <button
                    ref={triggerRef}
                    type="button"
                    aria-label="Open post actions"
                    aria-expanded={isOpen}
                    onClick={() => {
                        clearCloseTimeout();
                        setIsOpen((prev) => !prev);
                    }}
                    onFocus={() => {
                        clearCloseTimeout();
                        setIsOpen(true);
                    }}
                    className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background/80 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/20",
                        triggerToneClass,
                        isOpen ? "opacity-100" : "opacity-100 sm:opacity-70 sm:group-hover:opacity-100"
                    )}
                >
                    <MoreVertical className="h-3.5 w-3.5" />
                </button>
            </div>

            {isOpen && typeof document !== "undefined"
                ? createPortal(
                    <div
                        ref={menuRef}
                        style={menuStyle}
                        className="rounded-2xl border border-border/70 bg-background/98 p-2 shadow-2xl backdrop-blur dark:bg-card/98"
                        onMouseEnter={clearCloseTimeout}
                        onMouseLeave={scheduleClose}
                        role="menu"
                        aria-label="Post actions"
                    >
                        {ACTIONS.map((action) => (
                            <button
                                key={action}
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-600 transition hover:bg-muted/60 hover:text-foreground dark:text-zinc-300"
                                onClick={() => setIsOpen(false)}
                            >
                                {action}
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        ))}
                    </div>,
                    document.body
                )
                : null}
        </>
    );
}
