"use client";

import { Info } from "lucide-react";

/** Explains why some switches are fixed by the Site rather than the resident. */
export function SitePolicyNotice({ siteName }: { siteName: string }) {
    return (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-4 py-4 sm:px-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--vms-ink)]">
                <Info aria-hidden="true" className="h-4 w-4 shrink-0" />
                About site policies
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--vms-ink-muted)]">
                Some options may be locked by {siteName} site policies (e.g., visitor
                approval requirements, invitation limits, or notification rules). If an
                option is unavailable, contact your property management office.
            </p>
        </section>
    );
}
