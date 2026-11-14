"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";

import type { OrganizationSiteSummary } from "../api";
import {
    EmptyPanel,
    SectionHeading,
    SiteMark,
    SiteStatusBadge,
    SurfaceCard,
    ViewAllLink,
} from "./organization-ui";
import {
    ORGANIZATION_SITES_PATH,
    operatingTypeLabel,
} from "../lib";

export function SiteDirectoryPreview({
    sites,
    canCreate,
    onCreate,
}: {
    sites: OrganizationSiteSummary[];
    canCreate: boolean;
    onCreate: () => void;
}) {
    const preview = sites.slice(0, 5);

    return (
        <SurfaceCard>
            <SectionHeading
                title="Sites"
                description="Operating boundaries and the Places that sit beneath them."
                action={
                    sites.length > 0 ? (
                        <ViewAllLink href={ORGANIZATION_SITES_PATH} />
                    ) : canCreate ? (
                        <Button size="sm" variant="outline" onClick={onCreate}>
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            Create Site
                        </Button>
                    ) : null
                }
            />
            {preview.length === 0 ? (
                <EmptyPanel
                    title="No Sites yet"
                    description="Create the first Site to open an operating boundary for Places, staff and access control."
                    action={
                        canCreate ? (
                            <Button size="sm" onClick={onCreate}>
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                Create Site
                            </Button>
                        ) : null
                    }
                />
            ) : (
                <ul className="divide-y divide-[var(--vms-line)]">
                    {preview.map((site) => (
                        <li
                            key={site.id}
                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        >
                            <div className="flex min-w-0 items-start gap-3">
                                <SiteMark site={site} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[var(--vms-ink)]">
                                        {site.name}
                                    </p>
                                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--vms-ink-muted)]">
                                        <span>{operatingTypeLabel(site.use_case)}</span>
                                        <span aria-hidden="true">·</span>
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="h-3 w-3" aria-hidden="true" />
                                            {site.address || site.slug}
                                        </span>
                                        {site.parent_site_name ? (
                                            <>
                                                <span aria-hidden="true">·</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" aria-hidden="true" />
                                                    {site.parent_site_name}
                                                </span>
                                            </>
                                        ) : null}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:justify-end">
                                <span className="text-[11px] tabular-nums text-[var(--vms-ink-muted)]">
                                    {site.place_count} place{site.place_count === 1 ? "" : "s"}
                                </span>
                                <SiteStatusBadge site={site} />
                                <Link
                                    href={`/organization/sites/${site.id}`}
                                    className="inline-flex min-h-9 items-center gap-1 rounded-[var(--vms-radius-control)] px-2 text-xs font-semibold text-[var(--vms-ink)] transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                                >
                                    Open
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </SurfaceCard>
    );
}
