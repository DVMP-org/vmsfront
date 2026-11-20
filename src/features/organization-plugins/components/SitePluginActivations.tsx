"use client";

import { useState } from "react";
import { PlugZap } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { capabilityLabel, deploymentLabel, deploymentTone } from "../lib";
import { useSiteActivationActions, useSitePlugins } from "../queries";

/**
 * Site-scoped plugin activation for a Site super administrator.
 * The organization owns installation and configuration; the Site only decides
 * which installed plugins run there and which organization connection serves
 * each provider requirement.
 */
export function SitePluginActivations({
    siteId,
    siteName,
}: {
    siteId: string;
    siteName: string;
}) {
    const plugins = useSitePlugins(siteId);
    const actions = useSiteActivationActions(siteId);
    const [openId, setOpenId] = useState<string | null>(null);
    const [bindings, setBindings] = useState<Record<string, string>>({});

    if (plugins.isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    if (plugins.isError) {
        return (
            <div
                role="alert"
                className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
            >
                <p className="text-sm">Plugins for this Site could not be loaded.</p>
                <Button variant="outline" className="mt-3" onClick={() => plugins.refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    const rows = plugins.data?.plugins ?? [];
    const connections = plugins.data?.connections ?? [];

    if (!rows.length) {
        return (
            <EmptyState
                icon={PlugZap}
                title="No plugin is installed for the organization"
                description="An organization administrator installs plugins. Once a plugin is installed it appears here and this Site can activate it."
            />
        );
    }

    return (
        <section className="space-y-4">
            <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
                <h2 className="text-sm font-semibold">Plugins for {siteName}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                    Only this Site super administrator can activate a plugin here. Each
                    activation binds an organization provider connection; credentials stay
                    organization-owned.
                </p>
            </div>

            <ul className="space-y-3">
                {rows.map((plugin) => {
                    const expanded = openId === plugin.plugin_id;
                    const required = plugin.requirements.filter((entry) => entry.required);
                    const missing = required.filter((entry) => !entry.satisfied);
                    return (
                        <li
                            key={plugin.plugin_id}
                            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold">{plugin.name}</p>
                                    <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
                                        {plugin.description || "Organization plugin."}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge tone={deploymentTone(plugin.state)}>
                                        {deploymentLabel(plugin.state)}
                                    </StatusBadge>
                                    {plugin.state === "active" ? (
                                        <Button
                                            variant="outline"
                                            disabled={actions.suspend.isPending}
                                            onClick={() => actions.suspend.mutate(plugin.plugin_id)}
                                        >
                                            Suspend
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setOpenId(expanded ? null : plugin.plugin_id);
                                                setBindings({});
                                            }}
                                        >
                                            {expanded ? "Cancel" : "Activate"}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {plugin.requirements.length === 0 ? (
                                    <span className="text-xs text-[var(--vms-ink-muted)]">
                                        No provider requirement
                                    </span>
                                ) : (
                                    plugin.requirements.map((requirement) => (
                                        <Badge
                                            key={requirement.key}
                                            variant={requirement.satisfied ? "success" : "warning"}
                                        >
                                            {capabilityLabel(requirement.capability)}
                                            {requirement.satisfied
                                                ? requirement.provider
                                                    ? ` · ${requirement.provider}`
                                                    : " · bound"
                                                : " · missing connection"}
                                        </Badge>
                                    ))
                                )}
                            </div>

                            {expanded ? (
                                <div className="mt-4 space-y-3 border-t border-[var(--vms-line)] pt-4">
                                    {required.map((requirement) => {
                                        const capable = connections.filter((connection) =>
                                            connection.capabilities.includes(requirement.capability),
                                        );
                                        const matching = capable.filter(
                                            (connection) =>
                                                connection.enabled && connection.configured,
                                        );
                                        const controlId = `site-binding-${plugin.plugin_id}-${requirement.key}`;
                                        return (
                                            <div key={requirement.key} className="space-y-1">
                                                <label
                                                    htmlFor={controlId}
                                                    className="text-xs font-medium uppercase tracking-wide text-[var(--vms-ink-muted)]"
                                                >
                                                    {capabilityLabel(requirement.capability)}
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
                                                    options={matching.map((connection) => ({
                                                        value: connection.id,
                                                        label: `${connection.name} · ${connection.provider}`,
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
                                                        {capable.map((connection) => (
                                                            <li key={connection.id}>
                                                                {connection.name}:{" "}
                                                                {!connection.configured
                                                                    ? "credentials not saved"
                                                                    : "disabled for the organization"}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : null}
                                            </div>
                                        );
                                    })}

                                    <Button
                                        disabled={actions.activate.isPending}
                                        onClick={() =>
                                            actions.activate.mutate(
                                                { pluginId: plugin.plugin_id, bindings },
                                                {
                                                    onSuccess: () => {
                                                        setOpenId(null);
                                                        setBindings({});
                                                    },
                                                },
                                            )
                                        }
                                    >
                                        {actions.activate.isPending
                                            ? "Saving…"
                                            : missing.length
                                                ? "Save activation"
                                                : "Activate for this Site"}
                                    </Button>
                                    {missing.length ? (
                                        <p className="text-xs text-[var(--vms-ink-muted)]">
                                            Missing {missing.length} required binding
                                            {missing.length === 1 ? "" : "s"}. The Site stays in “Needs
                                            configuration” until one is bound.
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
