"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Mail, Phone, ShieldCheck } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";

type ForumAdminAvatarProps = {
    name: string;
    email?: string | null;
    phone?: string | null;
    residencyName?: string | null;
    avatarUrl?: string | null;
    side?: "left" | "right";
    className?: string;
};

export function ForumAdminAvatar({
    name,
    email,
    phone,
    residencyName,
    avatarUrl,
    side = "right",
    className,
}: ForumAdminAvatarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [panelStyle, setPanelStyle] = useState<CSSProperties>({ opacity: 0 });
    const containerRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
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
            const cardWidth = Math.min(288, window.innerWidth - 24);
            const viewportPadding = 12;
            const proposedLeft = side === "left" ? rect.left - cardWidth - 12 : rect.right + 12;
            const left = Math.min(
                Math.max(viewportPadding, proposedLeft),
                window.innerWidth - cardWidth - viewportPadding
            );
            const top = Math.min(
                Math.max(viewportPadding, rect.top - 4),
                window.innerHeight - 180 - viewportPadding
            );

            setPanelStyle({
                position: "fixed",
                top,
                left,
                width: cardWidth,
                zIndex: 60,
            });
        };

        const handlePointerDown = (event: MouseEvent | PointerEvent) => {
            const target = event.target as Node;
            if (
                !containerRef.current?.contains(target) &&
                !panelRef.current?.contains(target)
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
    }, [isOpen, side]);

    const adminName = name.trim() || "Estate Administrator";
    const initials = getInitials(adminName.split(" ")[0] ?? null, adminName.split(" ").slice(1).join(" ") || null);

    return (
        <div
            ref={containerRef}
            className={cn("relative flex-shrink-0", className)}
            onMouseEnter={() => {
                clearCloseTimeout();
                setIsOpen(true);
            }}
            onMouseLeave={scheduleClose}
        >
            <button
                ref={triggerRef}
                type="button"
                aria-label={`View ${adminName} details`}
                aria-expanded={isOpen}
                onClick={() => {
                    clearCloseTimeout();
                    setIsOpen((prev) => !prev);
                }}
                onFocus={() => {
                    clearCloseTimeout();
                    setIsOpen(true);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-100 text-xs font-semibold uppercase text-amber-700 shadow-sm transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/20"
            >
                AD
            </button>

            {isOpen && typeof document !== "undefined"
                ? createPortal(
                    <div
                        ref={panelRef}
                        style={panelStyle}
                        className="rounded-2xl border border-amber-200/80 bg-background/98 p-3 text-left shadow-2xl backdrop-blur dark:border-amber-400/20 dark:bg-card/98"
                        onMouseEnter={clearCloseTimeout}
                        onMouseLeave={scheduleClose}
                        role="dialog"
                        aria-label="Estate administrator details"
                    >
                        <div className="flex items-start gap-3">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={adminName}
                                    className="h-11 w-11 rounded-2xl border border-border/60 object-cover"
                                />
                            ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                                    {initials || "AD"}
                                </div>
                            )}
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800 dark:bg-amber-500/15 dark:text-amber-100">
                                    <ShieldCheck className="h-3 w-3" />
                                    Estate admin
                                </div>
                                <p className="truncate text-sm font-semibold text-foreground">{adminName}</p>
                                {residencyName ? (
                                    <p className="text-xs text-muted-foreground">{residencyName}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                            {email ? (
                                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-2">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="min-w-0 truncate">{email}</span>
                                </div>
                            ) : null}
                            {phone ? (
                                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-2">
                                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="min-w-0 truncate">{phone}</span>
                                </div>
                            ) : null}
                            {!email && !phone ? (
                                <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2">
                                    Contact details are not available for this administrator.
                                </div>
                            ) : null}
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
}
