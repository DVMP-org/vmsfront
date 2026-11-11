"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, ShieldCheck, UserCog } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";
import { useAdminProfile } from "@/hooks/use-admin";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";

import type { OrganizationManager } from "../api";
import {
    useOrganizationManagers,
    useOrganizationSiteRoles,
    useOrganizationSites,
    useRemoveOrganizationManager,
} from "../queries";
import { AddOrganizationManagerDrawer } from "./AddOrganizationManagerDrawer";
import { OrganizationManagerRolesDrawer } from "./OrganizationManagerRolesDrawer";
import { EmptyPanel, SurfaceCard } from "./organization-ui";

export function OrganizationManagersPage() {
    const current = useCurrentOrganization();
    const slug = current.organization?.slug ?? null;
    const profile = useAdminProfile();
    const can = (permission: string) =>
        profile.isSuccess &&
        !profile.isError &&
        hasAdminPermission(profile.data, permission);
    const searchParams = useSearchParams();
    const siteFilter = searchParams?.get("site") || null;
    const sites = useOrganizationSites(slug);
    const managers = useOrganizationManagers(slug, siteFilter);
    const roles = useOrganizationSiteRoles(slug);
    const remove = useRemoveOrganizationManager(slug);
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<OrganizationManager | null>(null);
    const [removing, setRemoving] = useState<OrganizationManager | null>(null);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return (managers.data?.managers ?? []).filter((manager) =>
            [
                manager.user.name,
                manager.user.email,
                manager.site.name,
                ...manager.roles.map((role) => role.name),
            ]
                .join(" ")
                .toLowerCase()
                .includes(term),
        );
    }, [managers.data?.managers, search]);

    const filteredSite = siteFilter
        ? sites.data?.find((site) => site.id === siteFilter) ?? null
        : null;

    const columns: Column<OrganizationManager>[] = [
        {
            key: "site",
            header: "Site",
            accessor: (manager) => (
                <span>
                    <strong className="block">{manager.site.name}</strong>
                    <span className="block text-xs text-[var(--vms-ink-muted)]">
                        {manager.site.address || manager.site.slug}
                    </span>
                </span>
            ),
            sortable: true,
        },
        {
            key: "manager",
            header: "Manager",
            accessor: (manager) => (
                <span>
                    <strong className="block">{manager.user.name}</strong>
                    <span className="block text-xs text-[var(--vms-ink-muted)]">
                        {manager.user.email || "No email"}
                    </span>
                </span>
            ),
            sortable: true,
        },
        {
            key: "roles",
            header: "Roles",
            accessor: (manager) => (
                <span className="flex flex-wrap gap-1">
                    {manager.roles.length ? (
                        manager.roles.map((role) => (
                            <Badge key={role.id} variant="neutral">
                                {role.name}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-xs text-[var(--vms-ink-muted)]">No roles</span>
                    )}
                </span>
            ),
        },
        {
            key: "authority",
            header: "Authority",
            accessor: (manager) => (
                <span className="text-xs text-[var(--vms-ink-muted)]">
                    {manager.effective_permissions.includes("*")
                        ? "Full Site authority"
                        : `${manager.effective_permissions.length} permissions`}
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            mobileHide: true,
            accessor: (manager) => (
                <span className="flex gap-2">
                    {can("roles.update") ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(manager)}
                        >
                            Roles
                        </Button>
                    ) : null}
                    {can("admins.update") ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRemoving(manager)}
                        >
                            Remove
                        </Button>
                    ) : null}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-5">
            <OrganizationAdminHeader
                eyebrow="People"
                title="Site managers"
                description="Managers hold Site management authority. They administer a Site and its child hierarchy, separately from Place parties."
                actions={
                    can("admins.create") ? (
                        <Button onClick={() => setAddOpen(true)} disabled={!slug}>
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Add manager
                        </Button>
                    ) : null
                }
            />

            {siteFilter ? (
                <InlineAlert
                    tone="info"
                    title={`Showing managers for ${filteredSite?.name || "the selected Site"}`}
                    action={
                        <Button size="sm" variant="outline" asChild>
                            <Link href="/organization/managers">Show all Sites</Link>
                        </Button>
                    }
                >
                    Clear the Site filter to see managers across the organization.
                </InlineAlert>
            ) : null}

            {managers.isError ? (
                <InlineAlert
                    tone="danger"
                    title="Site managers could not be loaded"
                    action={
                        <Button size="sm" variant="outline" onClick={() => managers.refetch()}>
                            Retry
                        </Button>
                    }
                >
                    {parseApiError(managers.error).message}
                </InlineAlert>
            ) : (
                <SurfaceCard>
                    <DataTable
                        data={filtered}
                        columns={columns}
                        tableLabel="Organization Site managers"
                        searchable
                        initialSearch={search}
                        onSearchChange={setSearch}
                        isLoading={managers.isPending}
                        emptyMessage="No Site managers match this search"
                        mobileSummary={(manager) => (
                            <span className="flex items-center gap-3">
                                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--vms-surface-subtle)]">
                                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <span>
                                    <strong className="block">{manager.user.name}</strong>
                                    <span className="text-xs text-[var(--vms-ink-muted)]">
                                        {manager.site.name}
                                    </span>
                                </span>
                            </span>
                        )}
                    />
                </SurfaceCard>
            )}

            {(managers.data?.managers.length ?? 0) === 0 && !managers.isPending ? (
                <SurfaceCard>
                    <EmptyPanel
                        title="No managers assigned yet"
                        description="Assign a manager so a Site has local management authority. Child Sites can also inherit authority from an ancestor Site."
                        action={
                            can("admins.create") ? (
                                <Button size="sm" onClick={() => setAddOpen(true)} disabled={!slug}>
                                    <UserCog className="h-4 w-4" aria-hidden="true" />
                                    Add manager
                                </Button>
                            ) : null
                        }
                    />
                </SurfaceCard>
            ) : null}

            <AddOrganizationManagerDrawer
                isOpen={addOpen}
                onClose={() => setAddOpen(false)}
                slug={slug}
                sites={sites.data ?? []}
                defaultSiteId={siteFilter}
            />

            <OrganizationManagerRolesDrawer
                manager={editing}
                roles={roles.data ?? []}
                slug={slug}
                onClose={() => setEditing(null)}
            />

            <Modal
                isOpen={Boolean(removing)}
                onClose={() => setRemoving(null)}
                title="Remove Site manager"
            >
                <div className="space-y-4 p-1">
                    <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
                        Remove {removing?.user.name} from {removing?.site.name}? They will
                        lose Site management authority immediately. A Site must retain at
                        least one manager.
                    </p>
                    {remove.isError ? (
                        <InlineAlert tone="danger" title="Manager could not be removed">
                            {parseApiError(remove.error).message}
                        </InlineAlert>
                    ) : null}
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setRemoving(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={remove.isPending}
                            onClick={() => {
                                if (!removing) return;
                                remove.mutate(removing.assignment_id, {
                                    onSuccess: () => setRemoving(null),
                                });
                            }}
                        >
                            {remove.isPending ? "Removing…" : "Remove manager"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
