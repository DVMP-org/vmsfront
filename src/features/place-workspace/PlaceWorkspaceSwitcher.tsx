"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Building2,
    Check,
    ChevronsUpDown,
    LayoutGrid,
    Shield,
    UserRound,
} from "lucide-react";

import { useVerifyToken } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";
import {
    areaForRelationship,
    qualifiedPlaceName,
    roleLabel,
    type WorkspaceArea,
} from "@/features/workspaces/catalog";
import { cn } from "@/lib/utils";

type EntryGroup = "administration" | Exclude<WorkspaceArea, "management">;

interface SwitcherEntry {
    key: string;
    group: EntryGroup;
    title: string;
    subtitle: string;
    href: string;
    placeId: string;
}

const groupOrder: EntryGroup[] = [
    "administration",
    "occupancy",
    "staff",
    "guest",
];

const groupMeta: Record<EntryGroup, { label: string; description: string }> = {
    administration: {
        label: "Administration",
        description: "Property operations, finance and access control.",
    },
    occupancy: {
        label: "Occupancy & tenancy",
        description: "Resident, owner, tenant and member workspaces.",
    },
    staff: {
        label: "Staff access",
        description: "Operational access without organization administration.",
    },
    guest: {
        label: "Hospitality stays",
        description: "Guest access, reservations and arrival details.",
    },
};

const adminRoles = new Set(["admin", "super_admin"]);

/**
 * Place workspace switcher.
 *
 * Lists every Place-backed workspace the signed-in person can open, including
 * the management (admin) workspace, so switching between an apartment and the
 * property dashboard never needs a detour through the directory page.
 */
export function PlaceWorkspaceSwitcher({
    placeId,
    fallbackName,
    onNavigate,
}: {
    placeId: string;
    fallbackName?: string;
    onNavigate?: () => void;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const setSelectedProperty = useAppStore((state) => state.setSelectedProperty);
    const memberships = useVerifyToken();

    const allRelationships = memberships.data?.workspaces ?? [];
    const relationships = allRelationships.filter(
        (relationship) => !adminRoles.has(relationship.role.toLowerCase()),
    );
    const adminRelationships = allRelationships.filter((relationship) =>
        adminRoles.has(relationship.role.toLowerCase()),
    );

    const administrationEntries: SwitcherEntry[] = [
        ...(memberships.data?.site_workspaces ?? []).map((workspace) => ({
            key: `administration:${workspace.site.id}`,
            group: "administration" as EntryGroup,
            title: `${workspace.site.name} management`,
            subtitle: "Site administrator",
            href: "/admin",
            placeId: workspace.site.id,
        })),
        ...adminRelationships.map((relationship) => ({
            key: `administration:place:${relationship.place.id}`,
            group: "administration" as EntryGroup,
            title: `${qualifiedPlaceName(relationship.place)} management`,
            subtitle: roleLabel(relationship.role),
            href: "/admin",
            placeId: relationship.place.id,
        })),
    ];
    const seenAdministration = new Set<string>();
    const entries: SwitcherEntry[] = [
        ...administrationEntries.filter((entry) => {
            if (seenAdministration.has(entry.placeId)) return false;
            seenAdministration.add(entry.placeId);
            return true;
        }),
        ...relationships.map((relationship) => {
            const area = areaForRelationship(relationship) as Exclude<
                WorkspaceArea,
                "management"
            >;
            return {
                key: `${area}:${relationship.id}`,
                group: area as EntryGroup,
                title: qualifiedPlaceName(relationship.place),
                subtitle: roleLabel(relationship.role),
                href: `/workspace/${relationship.place.id}`,
                placeId: relationship.place.id,
            };
        }),
    ];

    const current =
        entries.find((entry) => entry.href === `/workspace/${placeId}`) ??
        entries.find((entry) => entry.placeId === placeId);

    useEffect(() => {
        if (!open) return;
        const closeOnOutside = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutside);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutside);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [open]);

    function chooseEntry(entry: SwitcherEntry) {
        setOpen(false);
        onNavigate?.();
        if (entry.group !== "administration") {
            const relationship = relationships.find(
                (item) => item.place.id === entry.placeId,
            );
            if (relationship) {
                setSelectedProperty({
                    id: relationship.place.id,
                    name: qualifiedPlaceName(relationship.place),
                });
            }
        }
        router.push(entry.href);
    }

    const active = entries.find((entry) => entry.key === current?.key);

    return (
        <div className="relative" ref={containerRef}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                Place workspace
            </p>
            <button
                type="button"
                id="place-workspace-switcher-trigger"
                aria-expanded={open}
                aria-controls="place-workspace-switcher"
                onClick={() => setOpen((value) => !value)}
                className="flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-2.5 py-1.5 text-left transition hover:border-[var(--vms-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
            >
                <span
                    aria-hidden
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--vms-surface)] text-[var(--vms-ink)] ring-1 ring-[var(--vms-line)]"
                >
                    {active?.group === "administration" ? (
                        <Shield className="h-4 w-4" />
                    ) : (
                        <Building2 className="h-4 w-4" />
                    )}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[var(--vms-ink)]">
                        {current?.title ?? fallbackName ?? "Choose a workspace"}
                    </span>
                    <span className="block truncate text-[10px] text-[var(--vms-ink-muted)]">
                        {current?.subtitle ?? "Place workspace"}
                    </span>
                </span>
                <ChevronsUpDown
                    aria-hidden
                    className="h-3.5 w-3.5 shrink-0 text-[var(--vms-ink-muted)]"
                />
            </button>

            {open ? (
                <div
                    id="place-workspace-switcher"
                    className="absolute left-0 right-0 z-50 mt-2 max-h-[min(26rem,calc(100dvh-13rem))] overflow-y-auto rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-2 shadow-[var(--vms-shadow-overlay)]"
                >
                    {groupOrder.map((group) => {
                        const groupEntries = entries.filter(
                            (entry) => entry.group === group,
                        );
                        if (!groupEntries.length) return null;
                        return (
                            <div key={group}>
                                <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                                    {groupMeta[group].label}
                                </p>
                                {groupEntries.map((entry) => {
                                    const isActive = entry.key === current?.key;
                                    const Icon =
                                        entry.group === "administration"
                                            ? Shield
                                            : entry.group === "staff"
                                                ? UserRound
                                                : Building2;
                                    return (
                                        <button
                                            key={entry.key}
                                            type="button"
                                            aria-current={isActive ? "true" : undefined}
                                            onClick={() => chooseEntry(entry)}
                                            className={cn(
                                                "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                                                isActive
                                                    ? "bg-[var(--vms-surface-subtle)]"
                                                    : "hover:bg-[var(--vms-surface-subtle)]",
                                            )}
                                        >
                                            <Icon
                                                aria-hidden
                                                className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[13px] font-semibold text-[var(--vms-ink)]">
                                                    {entry.title}
                                                </span>
                                                <span className="block truncate text-[10px] text-[var(--vms-ink-muted)]">
                                                    {entry.subtitle}
                                                </span>
                                            </span>
                                            {isActive ? (
                                                <Check
                                                    aria-hidden
                                                    className="h-3.5 w-3.5 shrink-0 text-[var(--vms-active-accent)]"
                                                />
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {entries.length === 0 ? (
                        <p className="px-2 py-3 text-xs leading-5 text-[var(--vms-ink-muted)]">
                            No active Place relationships were found for this organization.
                        </p>
                    ) : null}

                    <div className="my-2 border-t border-[var(--vms-line)]" />
                    <Link
                        href="/?lobby=1"
                        onClick={() => {
                            setOpen(false);
                            onNavigate?.();
                        }}
                        className="flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold text-[var(--vms-ink)] transition hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                    >
                        <LayoutGrid aria-hidden className="h-4 w-4" />
                        View all workspaces
                    </Link>
                </div>
            ) : null}
        </div>
    );
}
