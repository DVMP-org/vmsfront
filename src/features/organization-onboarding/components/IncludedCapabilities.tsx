"use client";

import { Check, LayoutGrid } from "lucide-react";

import type { ContextCatalog, UseCase } from "@/features/context/api";

import {
    capabilityCount,
    capabilitiesFor,
    moduleLabel,
    operatingTypeProfile,
} from "../lib";

/**
 * Answers "what does this operating type actually give me?" with the grouped
 * modules the Site is provisioned with, straight from the shared catalogue.
 */
export function IncludedCapabilities({
    useCase,
    catalog,
}: {
    useCase: UseCase | "";
    catalog?: ContextCatalog | null;
}) {
    const profile = operatingTypeProfile(useCase);
    const groups = useCase ? capabilitiesFor(useCase, catalog) : [];

    return (
        <section
            aria-labelledby="included-capabilities-title"
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
        >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--vms-line)] p-5 sm:px-7">
                <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
                        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                        <h2
                            id="included-capabilities-title"
                            className="text-sm font-semibold text-[var(--vms-ink)]"
                        >
                            What this Site comes with
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                            {profile
                                ? `${profile.label} operations, provisioned the moment the Site is created.`
                                : "Choose an operating type to see the capabilities it provisions."}
                        </p>
                    </div>
                </div>
                {groups.length ? (
                    <span className="rounded-full bg-[var(--vms-surface-subtle)] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[var(--vms-ink-muted)]">
                        {capabilityCount(groups)} capabilities
                    </span>
                ) : null}
            </div>

            <div className="p-5 sm:p-7">
                {groups.length ? (
                    <dl className="space-y-4">
                        {groups.map((group) => (
                            <div key={group.key} className="sm:flex sm:gap-4">
                                <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)] sm:w-32 sm:pt-1.5">
                                    {group.label}
                                </dt>
                                <dd className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-0">
                                    {group.modules.map((module) => (
                                        <span
                                            key={module}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vms-line)] px-2.5 py-1 text-xs font-medium text-[var(--vms-ink)]"
                                        >
                                            <Check
                                                className="h-3 w-3 text-[var(--vms-success)]"
                                                aria-hidden="true"
                                            />
                                            {moduleLabel(module)}
                                        </span>
                                    ))}
                                </dd>
                            </div>
                        ))}
                    </dl>
                ) : (
                    <ul className="space-y-2 text-xs leading-5 text-[var(--vms-ink-muted)]">
                        <li>
                            Every Site gets operations, access, finance, community and
                            administration tooling.
                        </li>
                        <li>
                            The operating type adds its own specialist workspace and defaults
                            for Places created under it.
                        </li>
                    </ul>
                )}
            </div>
        </section>
    );
}
