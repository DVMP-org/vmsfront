"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * Surface used by every Place workspace page. Keeping the shell styling in one
 * place is what makes the pages feel like one product instead of nine forms.
 */
export const surfaceClass =
    "rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)]";
export const surfacePad = "p-4 sm:p-5";
export const listRowClass =
    "flex flex-wrap items-start gap-3 border-b border-[var(--vms-line)] py-3.5 last:border-b-0";

const successStatuses = new Set([
    "approved",
    "active",
    "allowed",
    "completed",
    "closed",
    "resolved",
    "paid",
    "current",
    "checked_in",
    "checked_out",
    "passed",
]);
const infoStatuses = new Set([
    "requested",
    "pending",
    "upcoming",
    "scheduled",
    "outstanding",
    "confirmed",
    "in_progress",
    "on_site",
    "exit_in_progress",
    "triaged",
    "assigned",
    "scheduled_for_payment",
    "open"
]);
const warningStatuses = new Set([
    "expiring",
    "overdue",
    "awaiting_approval",
    "awaiting_acknowledgement",
    "attention",
    "partially_paid",
    "due",
]);
const dangerStatuses = new Set([
    "declined",
    "denied",
    "expired",
    "cancelled",
    "canceled",
    "revoked",
    "failed",
    "rejected",
    "ended",
    "suspended",
    "closed"
]);

function normaliseStatus(status: string) {
    return status.trim().toLowerCase().replaceAll(/[\s-]+/g, "_");
}

export function statusTone(status: string): StatusTone {
    const key = normaliseStatus(status);
    if (successStatuses.has(key)) return "success";
    if (infoStatuses.has(key)) return "info";
    if (warningStatuses.has(key)) return "warning";
    if (dangerStatuses.has(key)) return "danger";
    return "neutral";
}

export function titleCaseStatus(status: string) {
    return status
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function StatusPill({ status }: { status?: string | null }) {


    if (!status?.trim()) {
        return <StatusBadge tone="neutral">Unknown</StatusBadge>;
    }
    return (
        <StatusBadge tone={statusTone(status)}>
            {titleCaseStatus(status)}
        </StatusBadge>
    );
}

export function PageHeading({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                {eyebrow ? (
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--vms-ink-muted)]">
                        {eyebrow}
                    </p>
                ) : null}
                <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-[var(--vms-ink)] sm:text-[30px]">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
                        {description}
                    </p>
                ) : null}
            </div>
            {action ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {action}
                </div>
            ) : null}
        </header>
    );
}

export function SectionCard({
    title,
    description,
    action,
    actionHref,
    actionLabel = "View all",
    children,
    className,
    bodyClassName,
}: {
    title?: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    actionHref?: string;
    actionLabel?: string;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    return (
        <section className={cn(surfaceClass, className)}>
            {title || action || actionHref ? (
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
                    <div className="min-w-0">
                        {title ? (
                            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--vms-ink)]">
                                {title}
                            </h2>
                        ) : null}
                        {description ? (
                            <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                                {description}
                            </p>
                        ) : null}
                    </div>
                    {action}
                    {!action && actionHref ? (
                        <Link
                            href={actionHref}
                            className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                        >
                            {actionLabel}
                            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                        </Link>
                    ) : null}
                </div>
            ) : null}
            <div className={cn("px-4 pb-4 pt-3 sm:px-5 sm:pb-5", bodyClassName)}>
                {children}
            </div>
        </section>
    );
}

export function IconTile({
    icon: Icon,
    tone = "neutral",
}: {
    icon: LucideIcon;
    tone?: "neutral" | "coral" | "success" | "warning" | "danger" | "info";
}) {
    const tones: Record<string, string> = {
        neutral: "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
        coral: "bg-[var(--vms-coral-soft)] text-[var(--vms-focus)]",
        success: "bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
        warning: "bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]",
        danger: "bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]",
        info: "bg-[color-mix(in_srgb,var(--vms-info)_10%,white)] text-[var(--vms-info)]",
    };
    return (
        <span
            aria-hidden
            className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                tones[tone],
            )}
        >
            <Icon className="h-4 w-4" />
        </span>
    );
}

export function EmptyRow({
    icon: Icon = Inbox,
    title,
    description,
    action,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--vms-line-strong)] px-4 py-8 text-center">
            <Icon aria-hidden className="h-6 w-6 text-[var(--vms-ink-muted)]" />
            <p className="text-sm font-semibold text-[var(--vms-ink)]">{title}</p>
            {description ? (
                <p className="max-w-sm text-xs leading-5 text-[var(--vms-ink-muted)]">
                    {description}
                </p>
            ) : null}
            {action}
        </div>
    );
}

export function NoticeBanner({
    icon: Icon,
    title,
    children,
    action,
    onDismiss,
}: {
    icon: LucideIcon;
    title: ReactNode;
    children?: ReactNode;
    action?: ReactNode;
    onDismiss?: () => void;
}) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--vms-warning-accent)_30%,white)] bg-[var(--vms-coral-soft)] px-4 py-3.5">
            <span
                aria-hidden
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/70 text-[var(--vms-focus)]"
            >
                <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--vms-ink)]">{title}</p>
                {children ? (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--vms-ink-muted)]">
                        {children}
                    </p>
                ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
            {onDismiss ? (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss notice"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[var(--vms-ink-muted)] transition hover:bg-white/60 hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                >
                    <span aria-hidden className="text-lg leading-none">
                        ×
                    </span>
                </button>
            ) : null}
        </div>
    );
}

export function Tabs<T extends string>({
    tabs,
    value,
    onChange,
    label,
}: {
    tabs: Array<{ value: T; label: string; count?: number }>;
    value: T;
    onChange: (value: T) => void;
    label: string;
}) {
    return (
        <div
            role="tablist"
            aria-label={label}
            className="flex gap-1 overflow-x-auto border-b border-[var(--vms-line)]"
        >
            {tabs.map((tab) => {
                const active = tab.value === value;
                return (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(tab.value)}
                        className={cn(
                            "relative inline-flex min-h-11 shrink-0 items-center gap-1.5 px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                            active
                                ? "font-semibold text-[var(--vms-ink)]"
                                : "text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
                        )}
                    >
                        {tab.label}
                        {typeof tab.count === "number" ? (
                            <span className="text-xs font-medium text-[var(--vms-ink-muted)]">
                                ({tab.count})
                            </span>
                        ) : null}
                        {active ? (
                            <span
                                aria-hidden
                                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--vms-active-accent)]"
                            />
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}

export function Toolbar({ children }: { children: ReactNode }) {
    return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export const controlClass =
    "min-h-10 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm text-[var(--vms-ink)] transition hover:border-[var(--vms-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]";

export function formatMoney(amount: string | number, currency?: string) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return String(amount);
    if (currency) {
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
                maximumFractionDigits: value % 1 === 0 ? 0 : 2,
            }).format(value);
        } catch {
            /* Fall through to a plain decimal for unknown currency codes. */
        }
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function PlaceRowSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-3" role="status" aria-busy="true">
            <span className="sr-only">Loading content</span>
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-2/5" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    );
}
