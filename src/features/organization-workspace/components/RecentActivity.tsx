"use client";

import Link from "next/link";
import { Building2, Plug, UserPlus } from "lucide-react";

import { formatDateTime, relativeTime } from "@/lib/datetime";

import type { ActivityEvent } from "../lib";
import { SectionHeading, SurfaceCard } from "./organization-ui";

const icons = {
    site: Building2,
    member: UserPlus,
    integration: Plug,
} as const;

export function RecentActivity({ events }: { events: ActivityEvent[] }) {
    return (
        <SurfaceCard>
            <SectionHeading
                title="Recent activity"
                description="Administrative changes across the organization."
            />
            {events.length === 0 ? (
                <p className="px-4 py-6 text-sm leading-6 text-[var(--vms-ink-muted)] sm:px-5">
                    No administrative activity has been recorded yet. Site creation,
                    membership changes and integration updates will appear here.
                </p>
            ) : (
                <ol className="divide-y divide-[var(--vms-line)]">
                    {events.map((event) => {
                        const Icon = icons[event.kind];
                        const content = (
                            <>
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
                                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13px] font-semibold text-[var(--vms-ink)]">
                                        {event.title}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                                        {event.description}
                                    </span>
                                </span>
                                <time
                                    dateTime={event.occurredAt}
                                    title={formatDateTime(event.occurredAt)}
                                    className="shrink-0 text-[11px] font-medium text-[var(--vms-ink-muted)]"
                                >
                                    {relativeTime(event.occurredAt)}
                                </time>
                            </>
                        );
                        return (
                            <li key={event.id}>
                                {event.href ? (
                                    <Link
                                        href={event.href}
                                        className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] sm:px-5"
                                    >
                                        {content}
                                    </Link>
                                ) : (
                                    <div className="flex min-h-14 items-center gap-3 px-4 py-2.5 sm:px-5">
                                        {content}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}
        </SurfaceCard>
    );
}
