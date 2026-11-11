"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronRight,
    Eye,
    MapPin,
    Pencil,
    Plus,
    ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { OrganizationSiteSummary } from "../api";
import { operatingTypeLabel, type SiteDisplayRow } from "../lib";
import { SiteMark, SiteStatusBadge } from "./organization-ui";

function ActionIcon({
    label,
    onClick,
    href,
    disabled,
    children,
}: {
    label: string;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    const className =
        "grid h-8 w-8 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] transition-colors hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] disabled:pointer-events-none disabled:opacity-40 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11";
    if (href && !disabled) {
        return (
            <Link href={href} aria-label={label} title={label} className={className}>
                {children}
            </Link>
        );
    }
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={className}
        >
            {children}
        </button>
    );
}

function SiteIdentity({ site }: { site: OrganizationSiteSummary }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <SiteMark site={site} />
            <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[var(--vms-ink)]">
                    {site.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[var(--vms-ink-muted)]">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {site.address || site.slug}
                </p>
            </div>
        </div>
    );
}

export function SiteDirectoryTable({
    rows,
    expanded,
    onToggle,
    allowed,
    onCreateChild,
    basePath,
}: {
    rows: SiteDisplayRow[];
    expanded: ReadonlySet<string>;
    onToggle: (siteId: string) => void;
    allowed: (action: string) => boolean;
    onCreateChild: (site: OrganizationSiteSummary) => void;
    basePath: string;
}) {
    const router = useRouter();

    function manageAccess(site: OrganizationSiteSummary) {
        router.push(`/organization/managers?site=${site.id}`);
    }

    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                    <caption className="sr-only">Organization Sites</caption>
                    <thead>
                        <tr className="border-b border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]">
                            {[
                                "Site",
                                "Parent Site",
                                "Operating type",
                                "Places",
                                "Status",
                                "Actions",
                            ].map((header) => (
                                <th
                                    key={header}
                                    scope="col"
                                    className={cn(
                                        "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]",
                                        header === "Places" && "text-right",
                                        header === "Actions" && "text-right",
                                    )}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ site, depth, hasChildren }) => {
                            const isExpanded = expanded.has(site.id);
                            return (
                                <tr
                                    key={site.id}
                                    className="border-b border-[var(--vms-line)] last:border-b-0 hover:bg-[var(--vms-surface-subtle)]"
                                >
                                    <td className="px-3 py-2.5">
                                        <div
                                            className="flex min-w-0 items-center gap-1"
                                            style={{ paddingLeft: depth * 16 }}
                                        >
                                            {hasChildren ? (
                                                <button
                                                    type="button"
                                                    aria-label={`${isExpanded ? "Collapse" : "Expand"} ${site.name}`}
                                                    aria-expanded={isExpanded}
                                                    onClick={() => onToggle(site.id)}
                                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"
                                                >
                                                    <ChevronRight
                                                        className={cn(
                                                            "h-4 w-4 transition-transform",
                                                            isExpanded && "rotate-90",
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            ) : (
                                                <span className="block h-7 w-7 shrink-0" />
                                            )}
                                            <SiteIdentity site={site} />
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-[var(--vms-ink-muted)]">
                                        {site.parent_site_name || "—"}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-[var(--vms-ink-muted)]">
                                        {operatingTypeLabel(site.use_case)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold tabular-nums text-[var(--vms-ink)]">
                                        {site.place_count}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5">
                                        <SiteStatusBadge site={site} />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center justify-end gap-0.5">
                                            <ActionIcon
                                                label={`View ${site.name}`}
                                                href={`${basePath}/${site.id}`}
                                                disabled={!allowed("show")}
                                            >
                                                <Eye className="h-4 w-4" aria-hidden="true" />
                                            </ActionIcon>
                                            <ActionIcon
                                                label={`Edit ${site.name}`}
                                                href={`${basePath}/${site.id}/edit`}
                                                disabled={!allowed("update")}
                                            >
                                                <Pencil className="h-4 w-4" aria-hidden="true" />
                                            </ActionIcon>
                                            <ActionIcon
                                                label={`Create child Site under ${site.name}`}
                                                onClick={() => onCreateChild(site)}
                                                disabled={!allowed("create")}
                                            >
                                                <Plus className="h-4 w-4" aria-hidden="true" />
                                            </ActionIcon>
                                            <ActionIcon
                                                label={`Manage Site managers for ${site.name}`}
                                                onClick={() => manageAccess(site)}
                                                disabled={!allowed("show")}
                                            >
                                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                            </ActionIcon>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ul className="divide-y divide-[var(--vms-line)] md:hidden">
                {rows.map(({ site, depth, hasChildren }) => {
                    const isExpanded = expanded.has(site.id);
                    return (
                        <li key={site.id} className="px-3 py-3">
                            <div
                                className="flex items-start gap-2"
                                style={{ paddingLeft: depth * 12 }}
                            >
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${site.name}`}
                                        aria-expanded={isExpanded}
                                        onClick={() => onToggle(site.id)}
                                        className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                                    >
                                        <ChevronRight
                                            className={cn(
                                                "h-4 w-4 transition-transform",
                                                isExpanded && "rotate-90",
                                            )}
                                            aria-hidden="true"
                                        />
                                    </button>
                                ) : (
                                    <span className="block h-9 w-9 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <SiteIdentity site={site} />
                                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[var(--vms-ink-muted)]">
                                        <div>
                                            <dt className="sr-only">Parent Site</dt>
                                            <dd>Parent: {site.parent_site_name || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="sr-only">Operating type</dt>
                                            <dd>{operatingTypeLabel(site.use_case)}</dd>
                                        </div>
                                        <div>
                                            <dt className="sr-only">Places</dt>
                                            <dd>
                                                {site.place_count} place
                                                {site.place_count === 1 ? "" : "s"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="sr-only">Status</dt>
                                            <dd>
                                                <SiteStatusBadge site={site} />
                                            </dd>
                                        </div>
                                    </dl>
                                    <div className="mt-2 flex flex-wrap items-center gap-1">
                                        <ActionIcon
                                            label={`View ${site.name}`}
                                            href={`${basePath}/${site.id}`}
                                            disabled={!allowed("show")}
                                        >
                                            <Eye className="h-4 w-4" aria-hidden="true" />
                                        </ActionIcon>
                                        <ActionIcon
                                            label={`Edit ${site.name}`}
                                            href={`${basePath}/${site.id}/edit`}
                                            disabled={!allowed("update")}
                                        >
                                            <Pencil className="h-4 w-4" aria-hidden="true" />
                                        </ActionIcon>
                                        <ActionIcon
                                            label={`Create child Site under ${site.name}`}
                                            onClick={() => onCreateChild(site)}
                                            disabled={!allowed("create")}
                                        >
                                            <Plus className="h-4 w-4" aria-hidden="true" />
                                        </ActionIcon>
                                        <ActionIcon
                                            label={`Manage Site managers for ${site.name}`}
                                            onClick={() => manageAccess(site)}
                                            disabled={!allowed("show")}
                                        >
                                            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                        </ActionIcon>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
