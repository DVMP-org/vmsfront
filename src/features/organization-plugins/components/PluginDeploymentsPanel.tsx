"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Server } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/datetime";
import type { PluginHealth, PluginSiteState } from "@/types/plugin";

import {
    capabilityLabel,
    deploymentLabel,
    deploymentTone,
    integrationSupports,
    pluginRequirements,
    requirementLabel,
    type PluginRecord,
} from "../lib";
import type {
    OrganizationIntegrationSummary,
    usePluginDeploymentActions,
} from "../queries";

interface SiteOption {
    id: string;
    name: string;
}

export function PluginDeploymentsPanel({
    plugin,
    sites,
    sitesLoading,
    isLoading,
    isError,
    onRetry,
    siteOptions,
    integrations,
    actions,
    health,
    onCheckHealth,
}: {
    plugin: PluginRecord;
    sites: PluginSiteState[];
    sitesLoading: boolean;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    siteOptions: SiteOption[];
    integrations: OrganizationIntegrationSummary[];
    actions: ReturnType<typeof usePluginDeploymentActions>;
    health: PluginHealth | undefined;
    onCheckHealth: () => void;
}) {
    const requirements = pluginRequirements(plugin);
    const activatedSiteIds = useMemo(
        () => new Set(sites.map((site) => site.site_id)),
        [sites],
    );
    const candidates = siteOptions.filter(
        (site) => !activatedSiteIds.has(site.id),
    );
    const [siteIds, setSiteIds] = useState<string[]>([]);
    const [bindings, setBindings] = useState<Record<string, string>>({});
    // One Site can be re-bound at a time: the editor is per deployment row, not
    // a second activation form.
    const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
    const [editBindings, setEditBindings] = useState<Record<string, string>>({});

    const pending = actions.activate.isPending || actions.suspend.isPending;

    const saveSiteBindings = (siteId: string) => {
        actions.activate.mutate(
            { siteIds: [siteId], bindings: editBindings },
            {
                onSuccess: () => {
                    setEditingSiteId(null);
                    setEditBindings({});
                },
            },
        );
    };

    const submit = () => {
        if (!siteIds.length) return;
        actions.activate.mutate(
            { siteIds, bindings },
            {
                onSuccess: () => {
                    setSiteIds([]);
                    setBindings({});
                },
            },
        );
    };

    return (
        <div className="space-y-5 p-5">
            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Activation health</h3>
                    <Button
                        variant="outline"
                        onClick={onCheckHealth}
                        disabled={pending}
                    >
                        <Activity aria-hidden="true" className="h-4 w-4" />
                        Test credentials & connection
                    </Button>
                </div>
                {health ? (
                    <div
                        role="status"
                        className="space-y-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 py-2 text-sm"
                    >
                        <p>
                            <Badge variant={health.healthy ? "success" : "warning"}>
                                {health.healthy ? "Healthy" : "Needs attention"}
                            </Badge>{" "}
                            {health.detail}
                        </p>
                        {health.connections.length ? (
                            <ul className="space-y-1">
                                {health.connections.map((connection) => (
                                    <li
                                        key={connection.id}
                                        className="flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]"
                                    >
                                        <Badge
                                            variant={connection.ok ? "success" : "warning"}
                                        >
                                            {connection.ok ? "Verified" : "Failed"}
                                        </Badge>
                                        <span className="font-medium text-[var(--vms-ink)]">
                                            {connection.provider}
                                        </span>
                                        {connection.detail}
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                ) : (
                    <p className="text-sm text-[var(--vms-ink-muted)]">
                        Health reports installation, plan coverage and whether
                        every active Site has its provider binding.
                    </p>
                )}
            </section>

            <section className="space-y-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] p-4">
                <h3 className="text-sm font-semibold">Activate for a Site</h3>
                {sitesLoading ? (
                    <p
                        role="status"
                        className="text-sm text-[var(--vms-ink-muted)]"
                    >
                        Loading Sites…
                    </p>
                ) : candidates.length === 0 ? (
                    <p className="text-sm text-[var(--vms-ink-muted)]">
                        Every Site in this organization already has a record for
                        this plugin.
                    </p>
                ) : (
                    <>
                        <div className="space-y-1">
                            <label
                                htmlFor="plugin-activation-site"
                                className="text-xs font-medium uppercase tracking-wide text-[var(--vms-ink-muted)]"
                            >
                                Sites
                            </label>
                            <SearchableSelect
                                inputId="plugin-activation-site"
                                isMulti
                                value={siteIds}
                                onChange={(next) => setSiteIds(next ?? [])}
                                options={candidates.map((site) => ({
                                    value: site.id,
                                    label: site.name,
                                }))}
                                placeholder="Select one or more Sites"
                                isClearable={false}
                            />
                        </div>

                        {requirements.map((requirement) => {
                            const capable = integrations.filter((integration) =>
                                integrationSupports(
                                    integration.capabilities,
                                    requirement.capability,
                                ),
                            );
                            const matching = capable.filter(
                                (integration) =>
                                    integration.enabled && integration.configured,
                            );
                            const controlId = `plugin-activation-binding-${requirement.key}`;
                            return (
                                <div key={requirement.key} className="space-y-1">
                                    <label
                                        htmlFor={controlId}
                                        className="text-xs font-medium uppercase tracking-wide text-[var(--vms-ink-muted)]"
                                    >
                                        {requirementLabel(requirement)}
                                        {requirement.required ? "" : " (optional)"}
                                    </label>
                                    <SearchableSelect
                                        inputId={controlId}
                                        value={bindings[requirement.key]}
                                        onChange={(next) =>
                                            setBindings((current) => {
                                                const updated = { ...current };
                                                if (next) {
                                                    updated[requirement.key] = next;
                                                } else {
                                                    delete updated[requirement.key];
                                                }
                                                return updated;
                                            })
                                        }
                                        options={matching.map((integration) => ({
                                            value: integration.id,
                                            label: `${integration.name} · ${capabilityLabel(requirement.capability)}`,
                                        }))}
                                        placeholder={
                                            matching.length
                                                ? "Select a provider connection"
                                                : capable.length
                                                    ? "No connection is ready yet"
                                                    : "No organization connection provides this capability"
                                        }
                                        isDisabled={!matching.length}
                                    />
                                    {!matching.length && capable.length ? (
                                        <ul className="space-y-0.5 text-xs text-[var(--vms-ink-muted)]">
                                            {capable.map((integration) => (
                                                <li key={integration.id}>
                                                    {integration.name}:{" "}
                                                    {!integration.configured
                                                        ? "credentials not saved"
                                                        : "disabled for the organization"}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                            );
                        })}

                        <Button onClick={submit} disabled={!siteIds.length || pending}>
                            {pending
                                ? "Saving…"
                                : siteIds.length > 1
                                    ? `Activate for ${siteIds.length} Sites`
                                    : "Activate for Site"}
                        </Button>
                        <p className="text-xs text-[var(--vms-ink-muted)]">
                            The same bindings are applied to every selected Site.
                            A Site the plugin does not support is reported without
                            cancelling the others. Without every required binding a
                            Site stays in “Needs configuration” until a provider is
                            assigned.
                        </p>
                    </>
                )}
            </section>

            {isLoading ? (
                <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
                    Loading Site deployments…
                </p>
            ) : isError ? (
                <div role="alert" className="space-y-3">
                    <p className="text-sm">
                        Site deployments could not be loaded.
                    </p>
                    <Button variant="outline" onClick={onRetry}>
                        Retry
                    </Button>
                </div>
            ) : sites.length === 0 ? (
                <div className="space-y-3">
                    <Server
                        aria-hidden="true"
                        className="h-6 w-6 text-[var(--vms-ink-muted)]"
                    />
                    <p className="text-sm font-semibold">
                        No Site has activated this plugin
                    </p>
                    <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
                        Activation is explicit per Site: installing a plugin for
                        the organization makes it eligible, and each Site must be
                        activated with a bound provider connection before its
                        workspaces can use it.
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {sites.map((site) => {
                        const missing = site.requirements.filter(
                            (requirement) => requirement.required && !requirement.satisfied,
                        );
                        const bound = Object.fromEntries(
                            site.requirements
                                .filter((requirement) => requirement.organization_integration_id)
                                .map((requirement) => [
                                    requirement.key,
                                    requirement.organization_integration_id as string,
                                ]),
                        );
                        const editing = editingSiteId === site.site_id;
                        return (
                        <li
                            key={site.site_id}
                            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold">
                                    {site.site_name || "Unnamed Site"}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge tone={deploymentTone(site.state)}>
                                        {deploymentLabel(site.state)}
                                    </StatusBadge>
                                    {requirements.length ? (
                                        <Button
                                            variant="outline"
                                            disabled={pending}
                                            onClick={() => {
                                                setEditingSiteId(
                                                    editing ? null : site.site_id,
                                                );
                                                setEditBindings(editing ? {} : bound);
                                            }}
                                        >
                                            {missing.length
                                                ? "Add connection"
                                                : "Change connection"}
                                        </Button>
                                    ) : null}
                                    {site.state === "active" ? (
                                        <Button
                                            variant="outline"
                                            disabled={pending}
                                            onClick={() =>
                                                actions.suspend.mutate(site.site_id)
                                            }
                                        >
                                            Suspend
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {site.requirements.length === 0 ? (
                                    <span className="text-xs text-[var(--vms-ink-muted)]">
                                        No provider requirement
                                    </span>
                                ) : (
                                    site.requirements.map((requirement) => (
                                        <Badge
                                            key={requirement.key}
                                            variant={
                                                requirement.satisfied
                                                    ? "success"
                                                    : "warning"
                                            }
                                        >
                                            {requirementLabel({
                                                key: requirement.key,
                                                capability: requirement.capability,
                                            })}
                                            {requirement.satisfied
                                                ? requirement.provider
                                                    ? ` · ${requirement.provider}`
                                                    : " · bound"
                                                : " · missing connection"}
                                        </Badge>
                                    ))
                                )}
                            </div>
                            <p className="mt-2 text-xs text-[var(--vms-ink-muted)]">
                                Configuration revision {site.config_revision}
                                {site.updated_at
                                    ? ` · updated ${formatDate(site.updated_at)}`
                                    : ""}
                            </p>

                            {editing ? (
                                <div className="mt-3 space-y-3 border-t border-[var(--vms-line)] pt-3">
                                    {requirements.map((requirement) => {
                                        const capable = integrations.filter(
                                            (integration) =>
                                                integrationSupports(
                                                    integration.capabilities,
                                                    requirement.capability,
                                                ),
                                        );
                                        const ready = capable.filter(
                                            (integration) =>
                                                integration.enabled &&
                                                integration.configured,
                                        );
                                        const currentId =
                                            editBindings[requirement.key];
                                        // Keep a disabled or incomplete connection
                                        // visible when it is what the Site already
                                        // uses, instead of showing an empty field.
                                        const currentConnection = currentId
                                            ? integrations.find(
                                                  (integration) =>
                                                      integration.id === currentId,
                                              )
                                            : undefined;
                                        const options = ready.map((integration) => ({
                                            value: integration.id,
                                            label: integration.name,
                                        }));
                                        if (
                                            currentId &&
                                            !ready.some(
                                                (integration) =>
                                                    integration.id === currentId,
                                            )
                                        ) {
                                            options.push({
                                                value: currentId,
                                                label: `${currentConnection?.name ?? "Current connection"} · needs attention`,
                                            });
                                        }
                                        const controlId = `site-rebind-${site.site_id}-${requirement.key}`;
                                        return (
                                            <div
                                                key={requirement.key}
                                                className="space-y-1"
                                            >
                                                <label
                                                    htmlFor={controlId}
                                                    className="text-xs font-medium uppercase tracking-wide text-[var(--vms-ink-muted)]"
                                                >
                                                    {requirementLabel(requirement)}
                                                    {requirement.required
                                                        ? ""
                                                        : " (optional)"}
                                                </label>
                                                <SearchableSelect
                                                    inputId={controlId}
                                                    value={
                                                        editBindings[requirement.key]
                                                    }
                                                    onChange={(next) =>
                                                        setEditBindings((current) => {
                                                            const updated = {
                                                                ...current,
                                                            };
                                                            if (next) {
                                                                updated[
                                                                    requirement.key
                                                                ] = next;
                                                            } else {
                                                                delete updated[
                                                                    requirement.key
                                                                ];
                                                            }
                                                            return updated;
                                                        })
                                                    }
                                                    options={options}
                                                    placeholder={
                                                        options.length
                                                            ? "Select a provider connection"
                                                            : "No organization connection provides this capability yet"
                                                    }
                                                    isDisabled={!options.length}
                                                />
                                                {!ready.length ? (
                                                    <p className="text-xs text-[var(--vms-ink-muted)]">
                                                        {capable.length
                                                            ? "Every matching connection needs credentials or is disabled."
                                                            : "No connection provides this capability yet."}{" "}
                                                        <Link
                                                            href="/organization/settings/integrations"
                                                            className="underline"
                                                        >
                                                            Add one
                                                        </Link>
                                                    </p>
                                                ) : null}
                                            </div>
                                        );
                                    })}

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            disabled={pending}
                                            onClick={() =>
                                                saveSiteBindings(site.site_id)
                                            }
                                        >
                                            {pending ? "Saving…" : "Save connection"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={pending}
                                            onClick={() => {
                                                setEditingSiteId(null);
                                                setEditBindings({});
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Link
                                            href="/organization/settings/integrations"
                                            className="text-xs underline text-[var(--vms-ink-muted)]"
                                        >
                                            Manage connections
                                        </Link>
                                    </div>
                                </div>
                            ) : null}
                        </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
