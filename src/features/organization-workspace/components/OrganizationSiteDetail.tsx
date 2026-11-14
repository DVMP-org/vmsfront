"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Archive,
    ArrowRight,
    Building2,
    MapPin,
    Pencil,
    Plus,
    Route,
    RotateCcw,
    ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";
import { placeKinds } from "@/features/places/api";
import { useAdminProfile } from "@/hooks/use-admin";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { formatDate } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";

import type { OrganizationSite } from "../api";
import { operatingTypeLabel } from "../lib";
import {
    useOrganizationSite,
    useOrganizationSites,
    useSetOrganizationSiteActive,
} from "../queries";
import { CreateSiteDrawer } from "./CreateSiteDrawer";
import {
    EmptyPanel,
    Metric,
    SectionHeading,
    SiteMark,
    SiteStatusBadge,
    SurfaceCard,
} from "./organization-ui";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                {label}
            </dt>
            <dd className="max-w-[60%] text-right text-sm text-[var(--vms-ink)]">
                {children}
            </dd>
        </div>
    );
}

function SiteFacts({ site }: { site: OrganizationSite }) {
    return (
        <dl className="divide-y divide-[var(--vms-line)]">
            <DetailRow label="Address">{site.address || "—"}</DetailRow>
            <DetailRow label="Time zone">{site.timezone}</DetailRow>
            <DetailRow label="Slug">{site.slug}</DetailRow>
            <DetailRow label="Created">{formatDate(site.created_at)}</DetailRow>
            <DetailRow label="Updated">{formatDate(site.updated_at)}</DetailRow>
        </dl>
    );
}

/**
 * Organization-owned Site detail.
 *
 * This screen is the portfolio view: it reads the organization Site endpoint,
 * never the Site administrator endpoint, so an organization owner can inspect
 * any Site without inheriting site-level management authority.
 */
export function OrganizationSiteDetail({ siteId }: { siteId: string }) {
    const { organization } = useCurrentOrganization();
    const slug = organization?.slug ?? null;
    const detail = useOrganizationSite(slug, siteId);
    const portfolio = useOrganizationSites(slug);
    const profile = useAdminProfile();
    const toggleActive = useSetOrganizationSiteActive(slug);
    const hasSidebar = useMediaQuery("(min-width: 1280px)");
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const allowed = (action: string) =>
        profile.isSuccess &&
        !profile.isError &&
        hasAdminPermission(profile.data, `places.${action}`);

    if (detail.isPending) {
        return (
            <div role="status" className="space-y-4">
                <span className="sr-only">Loading Site</span>
                <div className="h-9 w-72 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
                <div className="h-4 w-full max-w-xl animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
                <div className="h-64 animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]" />
            </div>
        );
    }

    if (detail.isError || !detail.data) {
        return (
            <div className="space-y-4">
                <OrganizationAdminHeader
                    eyebrow="Portfolio"
                    title="Site unavailable"
                    description="This Site could not be loaded for the current organization."
                    backHref="/organization/sites"
                    backLabel="Back to Sites"
                />
                <InlineAlert
                    tone="danger"
                    title="Site could not be loaded"
                    action={
                        <Button size="sm" variant="outline" onClick={() => detail.refetch()}>
                            Retry
                        </Button>
                    }
                >
                    {parseApiError(detail.error).message}
                </InlineAlert>
            </div>
        );
    }

    const site = detail.data;
    const parent = site.parent_site_id
        ? portfolio.data?.find((item) => item.id === site.parent_site_id) ?? null
        : null;
    const placeCount = site.places.length;

    const factsCard = (
        <SurfaceCard>
            <SectionHeading
                title="Site details"
                description="Portfolio metadata owned by the organization."
            />
            <SiteFacts site={site} />
        </SurfaceCard>
    );

    return (
        <div className="space-y-5">
            <OrganizationAdminHeader
                eyebrow="Portfolio"
                title={site.name}
                description={`${operatingTypeLabel(site.use_case)} Site${parent ? ` under ${parent.name}` : " at the organization root"
                    }.`}
                backHref="/organization/sites"
                backLabel="Back to Sites"
                actions={
                    <>
                        {allowed("create") ? (
                            <Button variant="outline" onClick={() => setCreateOpen(true)}>
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Create child Site
                            </Button>
                        ) : null}
                        {allowed("update") ? (
                            <Button variant="outline" asChild>
                                <Link href={`/organization/sites/${site.id}/edit`}>
                                    <Pencil className="h-4 w-4" aria-hidden="true" />
                                    Edit
                                </Link>
                            </Button>
                        ) : null}
                        {allowed("move") ? (
                            <Button variant="outline" asChild>
                                <Link href={`/organization/sites/${site.id}/move`}>
                                    <Route className="h-4 w-4" aria-hidden="true" />
                                    Move
                                </Link>
                            </Button>
                        ) : null}
                        <Button variant="outline" asChild>
                            <Link href={`/organization/managers?site=${site.id}`}>
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                Managers
                            </Link>
                        </Button>
                        {allowed("toggle_active") ? (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    toggleActive.mutate({
                                        siteId: site.id,
                                        active: !site.is_active,
                                    })
                                }
                                disabled={toggleActive.isPending}
                            >
                                {site.is_active ? (
                                    <Archive className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                )}
                                {site.is_active ? "Archive" : "Activate"}
                            </Button>
                        ) : null}
                    </>
                }
            />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-5">
                    <SurfaceCard>
                        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                            <SiteMark site={site} />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-[var(--vms-ink)]">
                                        {site.name}
                                    </p>
                                    <SiteStatusBadge site={site} />
                                </div>
                                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[var(--vms-ink-muted)]">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    {site.address || site.slug}
                                </p>
                            </div>
                            {!hasSidebar ? (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDetailsOpen(true)}
                                >
                                    Site details
                                </Button>
                            ) : null}
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-[var(--vms-line)] border-t border-[var(--vms-line)] sm:grid-cols-3">
                            <Metric label="Places" value={placeCount} />
                            <Metric label="Child Sites" value={site.child_sites.length} />
                            <Metric
                                label="Operating type"
                                value={operatingTypeLabel(site.use_case)}
                                detail={site.timezone}
                            />
                        </div>
                    </SurfaceCard>

                    <SurfaceCard>
                        <SectionHeading
                            title="Child Sites"
                            description="Sites nested beneath this operating boundary."
                        />
                        {site.child_sites.length === 0 ? (
                            <EmptyPanel
                                title="No child Sites"
                                description="Places can be added directly to this Site, or child Sites can be created for sub-communities."
                            />
                        ) : (
                            <ul className="divide-y divide-[var(--vms-line)]">
                                {site.child_sites.map((child) => (
                                    <li
                                        key={child.id}
                                        className="flex items-center gap-3 px-4 py-3 sm:px-5"
                                    >
                                        <SiteMark site={child} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-[var(--vms-ink)]">
                                                {child.name}
                                            </p>
                                            <p className="truncate text-xs text-[var(--vms-ink-muted)]">
                                                {child.address || child.slug}
                                            </p>
                                        </div>
                                        <Button size="sm" variant="ghost" asChild>
                                            <Link href={`/organization/sites/${child.id}`}>
                                                View
                                                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                            </Link>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SurfaceCard>

                    <SurfaceCard>
                        <SectionHeading
                            title="Places"
                            description="Physical spaces inside this Site. Places are managed in the Site workspace."
                        />
                        {site.places.length === 0 ? (
                            <EmptyPanel
                                title="No Places yet"
                                description="Site administrators add buildings, units, rooms and spaces through Site management."
                            />
                        ) : (
                            <ul className="divide-y divide-[var(--vms-line)]">
                                {site.places.map((place) => (
                                    <li
                                        key={place.id}
                                        className="flex items-center gap-3 px-4 py-3 sm:px-5"
                                    >
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
                                            <Building2 className="h-4 w-4" aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-[var(--vms-ink)]">
                                                {place.name}
                                            </p>
                                            <p className="truncate text-xs text-[var(--vms-ink-muted)]">
                                                {placeKinds[place.kind]} · {place.address || "No address"}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium text-[var(--vms-ink-muted)]">
                                            {place.is_active ? "Active" : "Archived"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SurfaceCard>
                </div>

                {hasSidebar ? (
                    <aside className="hidden xl:block">
                        <div className="sticky top-6 space-y-4">
                            <SurfaceCard>
                                <SectionHeading title="Portfolio facts" />
                                <SiteFacts site={site} />
                            </SurfaceCard>
                            <SurfaceCard>
                                <SectionHeading title="Scope" />
                                <dl className="divide-y divide-[var(--vms-line)]">
                                    <DetailRow label="Parent">
                                        {parent ? parent.name : "Organization root"}
                                    </DetailRow>
                                    <DetailRow label="Places">
                                        {placeCount} place{placeCount === 1 ? "" : "s"}
                                    </DetailRow>
                                    <DetailRow label="Child Sites">
                                        {site.child_sites.length}
                                    </DetailRow>
                                </dl>
                            </SurfaceCard>
                        </div>
                    </aside>
                ) : null}
            </div>

            <Drawer
                isOpen={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                title="Site details"
                description={site.name}
            >
                <div className="space-y-4 overflow-y-auto px-4 py-4">
                    <SiteFacts site={site} />
                    <InlineAlert tone="info" title="Scope">
                        This Site is{" "}
                        {parent ? `nested under ${parent.name}` : "at the organization root"}.
                    </InlineAlert>
                </div>
            </Drawer>

            <CreateSiteDrawer
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                slug={slug}
                sites={portfolio.data ?? []}
                parentSite={{
                    id: site.id,
                    name: site.name,
                    use_case: site.use_case,
                }}
                onCreated={() => {
                    setCreateOpen(false);
                    void detail.refetch();
                    void portfolio.refetch();
                }}
            />
        </div>
    );
}
