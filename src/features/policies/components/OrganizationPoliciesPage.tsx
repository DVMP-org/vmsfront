"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { useAdminProfile } from "@/hooks/use-admin";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { formatDateTime } from "@/lib/datetime";
import { hasAdminPermission } from "@/lib/permissions";

import type {
    PolicyDefinitionEntry,
    PolicySiteAssignment,
    PolicyTemplate,
} from "../api";
import {
    useDeletePolicyTemplate,
    useOrganizationPolicies,
    usePolicyAssignments,
    usePolicyCatalog,
    useRemovePolicyAssignment,
} from "../queries";
import { OrganizationSitePolicyDrawer } from "./OrganizationSitePolicyDrawer";
import { PolicyTemplateDrawer } from "./PolicyTemplateDrawer";
import { TemplateAssignDrawer } from "./TemplateAssignDrawer";

const contextLabel = (value: string) => value.replaceAll("_", " ");

export function OrganizationPoliciesPage() {
    const current = useCurrentOrganization();
    const slug = current.organization?.slug ?? "";
    const profile = useAdminProfile();
    const overview = useOrganizationPolicies(slug);
    const assignments = usePolicyAssignments(slug);
    const catalog = usePolicyCatalog(slug);
    const deleteTemplate = useDeletePolicyTemplate(slug);
    const removeAssignment = useRemovePolicyAssignment(slug);

    const canManage = hasAdminPermission(profile.data, ["settings.update"]);
    const [templateDrawer, setTemplateDrawer] = useState<{
        open: boolean;
        template: PolicyTemplate | null;
    }>({ open: false, template: null });
    const [assignDrawer, setAssignDrawer] = useState<{
        open: boolean;
        template: PolicyTemplate | null;
    }>({ open: false, template: null });
    const [deleteTarget, setDeleteTarget] = useState<PolicyTemplate | null>(null);
    const [sitePolicies, setSitePolicies] = useState<{
        siteId: string;
        siteName: string;
    } | null>(null);

    const sites = useMemo(
        () => assignments.data ?? [],
        [assignments.data],
    );
    const definitions = useMemo(() => {
        const map: Record<string, PolicyDefinitionEntry> = {};
        for (const group of catalog.data?.groups ?? []) {
            for (const policy of group.policies) map[policy.key] = policy;
        }
        return map;
    }, [catalog.data?.groups]);
    const siteNames = useMemo(
        () =>
            new Map<string, string>(
                sites.map((site) => [site.site_id, site.site_name] as const),
            ),
        [sites],
    );

    if (!slug) {
        return <p role="status">Loading organization…</p>;
    }
    if (overview.isError) {
        return (
            <InlineAlert tone="danger" title="Policy standards could not be loaded">
                Your role may not have access to organization settings. Ask an
                organization owner for the settings permission.
            </InlineAlert>
        );
    }

    const data = overview.data;
    const stats = [
        {
            label: "Available policies",
            value: data?.available_policies ?? 0,
            hint: "Applicable to at least one site",
        },
        {
            label: "Standards",
            value: data?.template_count ?? 0,
            hint: "Reusable organization templates",
        },
        {
            label: "Sites on a standard",
            value: data?.sites_with_template ?? 0,
            hint: `${data?.sites_without_template ?? 0} use platform defaults`,
        },
        {
            label: "Sites with overrides",
            value: data?.sites_with_overrides ?? 0,
            hint: "Explicit differences from the standard",
        },
    ];

    return (
        <main className="space-y-6 pb-10 text-[var(--vms-ink)]">
            <header className="flex flex-col gap-4 border-b border-[var(--vms-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                        Organization management
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                        Policies &amp; standards
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
                        Define how your sites operate once, assign the result to compatible
                        sites, and see where a site has deliberately diverged.
                    </p>
                </div>
                {canManage ? (
                    <Button
                        onClick={() => setTemplateDrawer({ open: true, template: null })}
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        New standard
                    </Button>
                ) : null}
            </header>

            <section aria-label="Policy overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
                    >
                        <p className="text-xs text-[var(--vms-ink-muted)]">{stat.label}</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {stat.value}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--vms-ink-muted)]">
                            {stat.hint}
                        </p>
                    </div>
                ))}
            </section>

            <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
                <header className="border-b border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-3 sm:px-5">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        Policy standards
                    </h2>
                </header>
                {overview.isPending ? (
                    <p className="px-4 py-4 text-sm text-[var(--vms-ink-muted)]" role="status">
                        Loading standards…
                    </p>
                ) : (data?.templates.length ?? 0) === 0 ? (
                    <EmptyState
                        title="No standards yet"
                        description="Create a reusable standard such as a residential estate baseline or hotel operations standard, then assign it to your sites."
                    />
                ) : (
                    <ul className="divide-y divide-[var(--vms-line)]">
                        {data?.templates.map((template) => (
                            <li
                                key={template.id}
                                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold">{template.name}</p>
                                    <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                                        {template.description || "No description"} · version{" "}
                                        {template.version} · {Object.keys(template.values).length}{" "}
                                        policies · assigned to {template.assigned_site_ids.length}{" "}
                                        site{template.assigned_site_ids.length === 1 ? "" : "s"}
                                    </p>
                                    <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                        {template.use_cases.map(contextLabel).join(" · ")}
                                    </p>
                                </div>
                                {canManage ? (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setTemplateDrawer({ open: true, template })
                                            }
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setAssignDrawer({ open: true, template })}
                                        >
                                            Assign
                                        </Button>
                                        <Button
                                            variant="destructive-outlined"
                                            size="sm"
                                            aria-label={`Delete ${template.name}`}
                                            onClick={() => setDeleteTarget(template)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                        </Button>
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
                <header className="border-b border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-3 sm:px-5">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        Site assignments and exceptions
                    </h2>
                </header>
                {sites.length === 0 ? (
                    <EmptyState
                        title="No sites in this organization"
                        description="Create a site first, then assign a policy standard to it."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead>
                                <tr className="border-b border-[var(--vms-line)] text-left text-[11px] uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                    <th className="px-4 py-2 font-semibold sm:px-5">Site</th>
                                    <th className="px-4 py-2 font-semibold">Context</th>
                                    <th className="px-4 py-2 font-semibold">Standard</th>
                                    <th className="px-4 py-2 font-semibold">Overrides</th>
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {sites.map((site: PolicySiteAssignment) => (
                                    <tr
                                        key={site.site_id}
                                        className="border-b border-[var(--vms-line)] last:border-b-0"
                                    >
                                        <td className="px-4 py-3 font-medium sm:px-5">
                                            {site.site_name}
                                            {!site.is_active ? (
                                                <span className="ml-2 text-[11px] text-[var(--vms-ink-muted)]">
                                                    archived
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 capitalize text-[var(--vms-ink-muted)]">
                                            {contextLabel(site.use_case)}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--vms-ink-muted)]">
                                            {site.template_name ?? "Platform defaults"}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--vms-ink-muted)]">
                                            {site.override_count === 0
                                                ? "None"
                                                : `${site.override_count} policy${site.override_count === 1 ? "" : "s"
                                                }`}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {canManage ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSitePolicies({
                                                                siteId: site.site_id,
                                                                siteName: site.site_name,
                                                            })
                                                        }
                                                    >
                                                        Overrides
                                                    </Button>
                                                    {site.template_id ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            isLoading={
                                                                removeAssignment.isPending &&
                                                                removeAssignment.variables === site.site_id
                                                            }
                                                            onClick={() =>
                                                                removeAssignment.mutate(site.site_id)
                                                            }
                                                        >
                                                            Remove
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
                <header className="border-b border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-3 sm:px-5">
                    <h2 className="text-sm font-semibold">Recent policy changes</h2>
                </header>
                {(data?.recent_changes.length ?? 0) === 0 ? (
                    <p className="px-4 py-4 text-sm text-[var(--vms-ink-muted)]">
                        No policy changes have been recorded yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-[var(--vms-line)]">
                        {data?.recent_changes.map((event) => (
                            <li
                                key={event.id}
                                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm sm:px-5"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium">{event.policy_name}</p>
                                    <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                                        {event.site_id
                                            ? siteNames.get(event.site_id) ?? "Site"
                                            : event.template_id
                                                ? "Organization standard"
                                                : "Organization"}
                                        {event.reason ? ` · ${event.reason}` : ""}
                                    </p>
                                </div>
                                <p className="text-xs text-[var(--vms-ink-muted)]">
                                    {formatDateTime(event.created_at)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <PolicyTemplateDrawer
                slug={slug}
                isOpen={templateDrawer.open}
                onClose={() =>
                    setTemplateDrawer({ open: false, template: null })
                }
                template={templateDrawer.template}
                catalog={catalog.data}
            />
            <TemplateAssignDrawer
                slug={slug}
                isOpen={assignDrawer.open}
                onClose={() => setAssignDrawer({ open: false, template: null })}
                template={assignDrawer.template}
                sites={sites}
                definitions={definitions}
            />
            <OrganizationSitePolicyDrawer
                slug={slug}
                siteId={sitePolicies?.siteId ?? null}
                siteName={sitePolicies?.siteName ?? "site"}
                isOpen={sitePolicies !== null}
                onClose={() => setSitePolicies(null)}
                canEdit={canManage}
            />
            <Modal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                title="Delete policy standard"
                description={
                    deleteTarget
                        ? `${deleteTarget.name} will be removed. Templates assigned to a site cannot be deleted.`
                        : undefined
                }
                size="sm"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            isLoading={deleteTemplate.isPending}
                            onClick={async () => {
                                if (!deleteTarget) return;
                                await deleteTemplate.mutateAsync(deleteTarget.id);
                                setDeleteTarget(null);
                            }}
                        >
                            Delete standard
                        </Button>
                    </div>
                }
            >
                <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
                    Sites keep the values already resolved for new operations until you
                    assign another standard. Existing site overrides are not changed.
                </p>
            </Modal>
        </main>
    );
}
