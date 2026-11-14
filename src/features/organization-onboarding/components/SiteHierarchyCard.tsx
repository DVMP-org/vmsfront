import { MapPin } from "lucide-react";

const LEVELS = [
    { label: "Organization", detail: "Billing and organization-wide settings" },
    { label: "Site", detail: "Access policy, gates and operating type" },
    { label: "Place", detail: "A building, unit, room or space" },
    { label: "Party", detail: "Resident, tenant, owner, staff or guest" },
];

/** Compact reminder of where the new Site sits before anything is created. */
export function SiteHierarchyCard({ organizationName }: { organizationName: string }) {
    return (
        <section
            aria-labelledby="site-hierarchy-title"
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
        >
            <h2
                id="site-hierarchy-title"
                className="flex items-center gap-2 text-sm font-semibold text-[var(--vms-ink)]"
            >
                <MapPin className="h-4 w-4 text-[var(--vms-action)]" aria-hidden="true" />
                How the hierarchy fits
            </h2>
            <ol className="mt-3 space-y-2.5">
                {LEVELS.map((level, index) => (
                    <li key={level.label} className="flex gap-2.5">
                        <span
                            aria-hidden="true"
                            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--vms-surface-subtle)] text-[10px] font-semibold tabular-nums text-[var(--vms-ink-muted)]"
                        >
                            {index + 1}
                        </span>
                        <span className="min-w-0 text-xs leading-5">
                            <span className="font-semibold text-[var(--vms-ink)]">
                                {level.label}
                            </span>
                            <span className="block text-[var(--vms-ink-muted)]">
                                {level.label === "Organization"
                                    ? organizationName
                                    : level.detail}
                            </span>
                        </span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
