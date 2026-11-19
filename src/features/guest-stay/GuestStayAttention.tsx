"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";

import { formatDateTime, relativeTime } from "@/lib/datetime";
import type { Stay } from "@/features/hospitality/contracts";

/** How soon a departure becomes something the guest must act on. */
const DEPARTURE_WARNING_MS = 24 * 60 * 60 * 1000;

/**
 * The guest's attention queue.
 *
 * Site administrators see expiring stays in their operations queue; the guest
 * sees the one consequence that belongs to them: their room is about to be due
 * back. It is derived from the same stay dates the desk uses, so the two views
 * cannot disagree about when the stay ends.
 */
export function GuestStayAttention({ stays }: { stays: Stay[] }) {
    const now = Date.now();
    const departures = stays
        .filter(
            (stay) =>
                stay.status === "checked_in" &&
                new Date(stay.planned_check_out).getTime() <=
                now + DEPARTURE_WARNING_MS,
        )
        .sort(
            (left, right) =>
                new Date(left.planned_check_out).getTime() -
                new Date(right.planned_check_out).getTime(),
        );

    if (!departures.length) {
        return null;
    }

    return (
        <section
            aria-labelledby="guest-attention-title"
            className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-warning)_35%,white)] bg-[var(--vms-warning-subtle)]"
        >
            <div className="border-b border-[color-mix(in_srgb,var(--vms-warning)_25%,white)] px-4 py-3 sm:px-5">
                <h2
                    id="guest-attention-title"
                    className="flex items-center gap-2 text-sm font-semibold text-[var(--vms-ink)]"
                >
                    <AlertTriangle
                        aria-hidden
                        className="h-4 w-4 text-[var(--vms-warning)]"
                    />
                    Needs attention
                </h2>
            </div>
            <ul className="divide-y divide-[color-mix(in_srgb,var(--vms-warning)_25%,white)]">
                {departures.map((stay) => {
                    const checkout = new Date(stay.planned_check_out).getTime();
                    const overdue = checkout <= now;
                    return (
                        <li
                            key={stay.id}
                            className="flex flex-wrap items-start gap-3 px-4 py-3 sm:px-5"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[var(--vms-ink)]">
                                    {overdue ? "Your stay was due to end" : "Your stay ends soon"}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                                    {overdue
                                        ? `Checkout was scheduled for ${formatDateTime(
                                            stay.planned_check_out,
                                        )}. Contact reception to extend or check out.`
                                        : `Checkout is ${relativeTime(
                                            stay.planned_check_out,
                                        )} (${formatDateTime(
                                            stay.planned_check_out,
                                        )}). Contact reception if you need to extend.`}
                                </p>
                            </div>
                            <a
                                href="#guest-stays-title"
                                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-xs font-semibold text-[var(--vms-ink)] hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                            >
                                View stay
                                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                            </a>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
