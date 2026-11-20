"use client";

import Link from "next/link";
import { ArrowRight, PlugZap } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { PluginSiteState } from "@/types/plugin";

import {
    capabilityLabel,
    integrationSupports,
    pluginRequirements,
    requirementLabel,
    type PluginRecord,
} from "../lib";
import type { OrganizationIntegrationSummary } from "../queries";

export function PluginIntegrationsPanel({
    plugin,
    sites,
    integrations,
    isLoading,
}: {
    plugin: PluginRecord;
    sites: PluginSiteState[];
    integrations: OrganizationIntegrationSummary[];
    isLoading: boolean;
}) {
    const requirements = pluginRequirements(plugin);
    const integrationsHref = "/organization/settings/integrations";

    if (!requirements.length) {
        return (
            <div className="space-y-4 p-5">
                <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
                    This plugin declares no provider requirement, so it needs no
                    connection before a Site can activate it.
                </p>
                <Button variant="outline" asChild>
                    <Link href={integrationsHref}>
                        Provider integrations
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5 p-5">
            <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
                Provider credentials live once per organization under Integrations. A
                Site activates this plugin by binding one of those connections; the same
                connection can serve several Sites.
            </p>

            {requirements.map((requirement) => {
                const providers = Array.from(
                    new Set(
                        sites
                            .flatMap((site) => site.requirements)
                            .filter(
                                (entry) =>
                                    entry.key === requirement.key && entry.satisfied && entry.provider,
                            )
                            .map((entry) => entry.provider as string),
                    ),
                );
                const matching = integrations.filter((integration) =>
                    integrationSupports(integration.capabilities, requirement.capability),
                );

                return (
                    <section
                        key={requirement.key}
                        className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] p-4"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-semibold">
                                    {requirementLabel(requirement)}
                                </h3>
                                <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                                    {capabilityLabel(requirement.capability)}
                                </p>
                            </div>
                            <Badge variant={requirement.required === false ? "outline" : "info"}>
                                {requirement.required === false ? "Optional" : "Required"}
                            </Badge>
                        </div>

                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                            Bound at
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {isLoading ? (
                                <span className="text-sm text-[var(--vms-ink-muted)]">
                                    Checking deployments…
                                </span>
                            ) : providers.length ? (
                                providers.map((provider) => (
                                    <Badge key={provider} variant="success">
                                        {provider}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-[var(--vms-ink-muted)]">
                                    No Site has bound a connection for this capability yet.
                                </span>
                            )}
                        </div>

                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                            Organization connections that can satisfy it
                        </p>
                        {matching.length ? (
                            <ul className="mt-1 space-y-1.5">
                                {matching.map((integration) => (
                                    <li
                                        key={integration.id}
                                        className="flex flex-wrap items-center gap-2 text-sm"
                                    >
                                        <PlugZap
                                            aria-hidden="true"
                                            className="h-4 w-4 text-[var(--vms-ink-muted)]"
                                        />
                                        <span className="font-medium">{integration.name}</span>
                                        <Badge variant={integration.enabled ? "success" : "outline"}>
                                            {integration.enabled ? "Enabled" : "Disabled"}
                                        </Badge>
                                        <Badge
                                            variant={integration.configured ? "success" : "warning"}
                                        >
                                            {integration.configured ? "Configured" : "Needs credentials"}
                                        </Badge>
                                        <span className="text-xs text-[var(--vms-ink-muted)]">
                                            {capabilityLabel(requirement.capability)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                                No organization connection provides this capability yet. Add one
                                under Integrations, then activate the plugin for a Site.
                            </p>
                        )}
                    </section>
                );
            })}

            <Button variant="outline" asChild>
                <Link href={integrationsHref}>
                    Manage provider integrations
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
            </Button>
        </div>
    );
}
