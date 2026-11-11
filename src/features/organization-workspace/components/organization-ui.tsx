"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/strings";

import type { OrganizationSiteSummary } from "../api";
import { siteStatus } from "../lib";

export function SurfaceCard({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                "rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]",
                className,
            )}
        >
            {children}
        </section>
    );
}

export function SectionHeading({
    title,
    description,
    action,
    className,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col gap-3 border-b border-[var(--vms-line)] px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5",
                className,
            )}
        >
            <div className="min-w-0">
                <h2 className="text-[15px] font-semibold leading-5 tracking-[-0.01em] text-[var(--vms-ink)]">
                    {title}
                </h2>
                {description ? (
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--vms-ink-muted)]">
                        {description}
                    </p>
                ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

export function ViewAllLink({ href, label = "View all" }: { href: string; label?: string }) {
    return (
        <Link
            href={href}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--vms-radius-control)] px-2 text-xs font-semibold text-[var(--vms-ink)] transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
        >
            {label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
    );
}

export function Metric({
    label,
    value,
    detail,
}: {
    label: string;
    value: string | number;
    detail?: string;
}) {
    return (
        <div className="flex flex-col gap-1 px-4 py-3.5 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                {label}
            </p>
            <p className="text-xl font-semibold leading-7 tracking-[-0.02em] text-[var(--vms-ink)]">
                {value}
            </p>
            {detail ? (
                <p className="truncate text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                    {detail}
                </p>
            ) : null}
        </div>
    );
}

export function SiteMark({
    site,
    size = "md",
}: {
    site: Pick<OrganizationSiteSummary, "name" | "is_active">;
    size?: "sm" | "md";
}) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "grid shrink-0 place-items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] font-semibold text-[var(--vms-ink-muted)]",
                size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-[11px]",
            )}
        >
            {initials(site.name) || <Building2 className="h-4 w-4" />}
        </span>
    );
}

export function SiteStatusBadge({
    site,
}: {
    site: Pick<OrganizationSiteSummary, "is_active">;
}) {
    const status = siteStatus(site);
    return <Badge variant={status.tone}>{status.label}</Badge>;
}

export function EmptyPanel({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-start gap-3 px-4 py-8 sm:items-center sm:px-6 sm:text-center">
            <span className="grid h-10 w-10 place-items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
                <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="max-w-md">
                <p className="text-sm font-semibold text-[var(--vms-ink)]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                    {description}
                </p>
            </div>
            {action}
        </div>
    );
}
