"use client";

import Link from "next/link";
import {
    ArrowRight,
    Plug,
    Puzzle,
    Settings,
    ShieldCheck,
    Users,
} from "lucide-react";

import { hasAdminPermission } from "@/lib/permissions";
import type { Admin } from "@/types";

import { SectionHeading, SurfaceCard } from "./organization-ui";

const links = [
    {
        href: "/organization/administrators",
        label: "Members & Roles",
        description: "Organization administrators and delegated access.",
        icon: Users,
        permissions: ["admins.list"],
    },
    {
        href: "/organization/integrations",
        label: "Integrations",
        description: "Shared providers, credentials and connection health.",
        icon: Plug,
        permissions: ["admins.list", "organizations.show"],
    },
    {
        href: "/organization/plugins",
        label: "Plugins",
        description: "Business tools available to every Site.",
        icon: Puzzle,
        permissions: ["admins.list"],
    },
    {
        href: "/organization/settings",
        label: "Organization Settings",
        description: "Identity, operating context and shared configuration.",
        icon: Settings,
        permissions: ["organizations.show"],
    },
];

export function AdministrationLinks({
    profile,
}: {
    profile?: Admin | null;
}) {
    const visible = links.filter((link) =>
        hasAdminPermission(profile, link.permissions),
    );

    return (
        <SurfaceCard>
            <SectionHeading
                title="Administration"
                description="Organization-wide access and configuration."
            />
            {visible.length === 0 ? (
                <div className="flex items-start gap-3 px-4 py-5 text-sm text-[var(--vms-ink-muted)] sm:px-5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p className="leading-6">
                        Your role has no organization administration grants. Site
                        administration remains available inside your authorized Site
                        workspace.
                    </p>
                </div>
            ) : (
                <ul className="grid sm:grid-cols-2">
                    {visible.map((link) => {
                        const Icon = link.icon;
                        return (
                            <li
                                key={link.href}
                                className="border-b border-[var(--vms-line)] last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                            >
                                <Link
                                    href={link.href}
                                    className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] sm:px-5"
                                >
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[13px] font-semibold text-[var(--vms-ink)]">
                                            {link.label}
                                        </span>
                                        <span className="mt-0.5 block text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                                            {link.description}
                                        </span>
                                    </span>
                                    <ArrowRight
                                        className="h-3.5 w-3.5 shrink-0 text-[var(--vms-ink-muted)] transition-transform group-hover:translate-x-0.5"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </SurfaceCard>
    );
}
