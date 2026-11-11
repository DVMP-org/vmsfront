"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronsDownUp, ChevronsUpDown, Plus, Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { fieldControlClassName } from "@/components/ui/form/Field";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";
import { useAdminProfile } from "@/hooks/use-admin";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import type { UseCase } from "@/features/context/api";

import type { CreatedOrganizationSite, OrganizationSiteSummary } from "../api";
import {
    filterSites,
    flattenSitesForDisplay,
    operatingTypeLabels,
} from "../lib";
import { useOrganizationSites } from "../queries";
import { CreateSiteDrawer } from "./CreateSiteDrawer";
import { ImportModelsDrawer } from "./ImportModelsDrawer";
import { EmptyPanel, SurfaceCard } from "./organization-ui";
import { SiteDirectoryTable } from "./SiteDirectoryTable";

type StatusFilter = "all" | "active" | "archived";

export function SitesDirectoryPage() {
    const current = useCurrentOrganization();
    const slug = current.organization?.slug ?? null;
    const sitesQuery = useOrganizationSites(slug);
    const profile = useAdminProfile();
    const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data]);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [useCase, setUseCase] = useState<UseCase | "all">("all");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [createOpen, setCreateOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [parentSite, setParentSite] = useState<OrganizationSiteSummary | null>(
        null,
    );
    const [created, setCreated] = useState<CreatedOrganizationSite | null>(null);
    const initialized = useRef(false);

    const allowed = (action: string) =>
        profile.isSuccess &&
        !profile.isError &&
        hasAdminPermission(profile.data, `places.${action}`);

    useEffect(() => {
        if (initialized.current || sites.length === 0) return;
        initialized.current = true;
        setExpanded(
            new Set(
                sites
                    .filter((site) => site.child_site_count > 0)
                    .map((site) => site.id),
            ),
        );
    }, [sites]);

    const visibleSites = useMemo(
        () => filterSites(sites, { search, status, useCase }),
        [sites, search, status, useCase],
    );
    const rows = useMemo(
        () => flattenSitesForDisplay(visibleSites, expanded),
        [visibleSites, expanded],
    );

    function toggle(siteId: string) {
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(siteId)) next.delete(siteId);
            else next.add(siteId);
            return next;
        });
    }

    function expandAll() {
        setExpanded(new Set(visibleSites.map((site) => site.id)));
    }

    function collapseAll() {
        setExpanded(new Set());
    }

    function openCreate(site?: OrganizationSiteSummary | null) {
        setParentSite(site ?? null);
        setCreateOpen(true);
    }

    return (
        <div className="space-y-5">
            <OrganizationAdminHeader
                eyebrow="Portfolio"
                title="Sites"
                description="Every Site owned by this organization. Sites contain child Sites and Places; a Place never contains a Site."
                actions={
                    allowed("create") ? (
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => setImportOpen(true)}>
                                <Upload className="h-4 w-4" aria-hidden="true" />
                                Import
                            </Button>
                            <Button onClick={() => openCreate()}>
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Create Site
                            </Button>
                        </div>
                    ) : null
                }
            />

            {created ? (
                <InlineAlert
                    tone="success"
                    title={`${created.name} created`}
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button size="sm" variant="outline" asChild>
                                <Link href={`/organization/sites/${created.id}`}>
                                    Open Site
                                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setCreated(null)}>
                                Dismiss
                            </Button>
                        </div>
                    }
                >
                    The Site is now in the directory. Add Places through Site management when
                    the operating boundary is configured.
                </InlineAlert>
            ) : null}

            {profile.isError ? (
                <InlineAlert
                    tone="danger"
                    title="Site permissions could not be loaded"
                    action={
                        <Button size="sm" variant="outline" onClick={() => profile.refetch()}>
                            Retry
                        </Button>
                    }
                >
                    {parseApiError(profile.error).message}
                </InlineAlert>
            ) : !profile.isPending && !allowed("list") ? (
                <InlineAlert tone="warning" title="Site directory unavailable">
                    Your current role cannot view organization Sites.
                </InlineAlert>
            ) : null}

            <SurfaceCard>
                <div className="flex flex-col gap-3 border-b border-[var(--vms-line)] p-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="relative flex min-h-10 flex-1 items-center">
                            <Search
                                className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--vms-ink-muted)]"
                                aria-hidden="true"
                            />
                            <span className="sr-only">Search Sites</span>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search Sites, addresses or parent Sites"
                                className={`${fieldControlClassName} pl-9`}
                                maxLength={120}
                            />
                        </label>
                        <label className="flex items-center gap-2">
                            <span className="sr-only">Filter by status</span>
                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value as StatusFilter)
                                }
                                className={`${fieldControlClassName} min-h-10 w-auto`}
                                aria-label="Filter by status"
                            >
                                <option value="all">All statuses</option>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </label>
                        <label className="flex items-center gap-2">
                            <span className="sr-only">Filter by operating type</span>
                            <select
                                value={useCase}
                                onChange={(event) =>
                                    setUseCase(event.target.value as UseCase | "all")
                                }
                                className={`${fieldControlClassName} min-h-10 w-auto`}
                                aria-label="Filter by operating type"
                            >
                                <option value="all">All operating types</option>
                                {(Object.entries(operatingTypeLabels) as [UseCase, string][]).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>
                    </div>
                    <div className="flex items-center justify-between gap-2 lg:justify-end">
                        <p
                            className="text-[11px] font-medium text-[var(--vms-ink-muted)]"
                            role="status"
                            aria-live="polite"
                        >
                            {visibleSites.length} of {sites.length} Site
                            {sites.length === 1 ? "" : "s"}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={expandAll}
                                disabled={rows.length === 0}
                            >
                                <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                                Expand all
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={collapseAll}
                                disabled={expanded.size === 0}
                            >
                                <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                                Collapse all
                            </Button>
                        </div>
                    </div>
                </div>

                {sitesQuery.isError && !sitesQuery.data ? (
                    <div className="p-3">
                        <InlineAlert
                            tone="danger"
                            title="Sites could not be loaded"
                            action={
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => sitesQuery.refetch()}
                                >
                                    Retry
                                </Button>
                            }
                        >
                            {parseApiError(sitesQuery.error).message}
                        </InlineAlert>
                    </div>
                ) : sitesQuery.isPending ? (
                    <div role="status" className="space-y-2 p-3">
                        <span className="sr-only">Loading Sites</span>
                        {Array.from({ length: 5 }, (_, index) => (
                            <div
                                key={index}
                                className="h-12 animate-pulse rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]"
                            />
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <EmptyPanel
                        title={sites.length === 0 ? "No Sites yet" : "No Sites match these filters"}
                        description={
                            sites.length === 0
                                ? "Create the first Site to open an operating boundary for Places, staff and access control."
                                : "Clear the search or status filter to see the full portfolio."
                        }
                        action={
                            sites.length === 0 && allowed("create") ? (
                                <Button size="sm" onClick={() => openCreate()}>
                                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                    Create Site
                                </Button>
                            ) : null
                        }
                    />
                ) : (
                    <SiteDirectoryTable
                        rows={rows}
                        expanded={expanded}
                        onToggle={toggle}
                        allowed={allowed}
                        onCreateChild={(site) => openCreate(site)}
                        basePath="/organization/sites"
                    />
                )}
            </SurfaceCard>

            <CreateSiteDrawer
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                slug={slug}
                sites={sites}
                parentSite={parentSite}
                onCreated={(site) => {
                    setCreated(site);
                    if (parentSite) {
                        setExpanded((current) => new Set(current).add(parentSite.id));
                    }
                    setParentSite(null);
                }}
            />

            <ImportModelsDrawer
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                slug={slug}
            />
        </div>
    );
}
