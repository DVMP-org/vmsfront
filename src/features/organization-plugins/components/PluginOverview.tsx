"use client";

import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { titleCase } from "@/lib/strings";
import { pluginEntitlementLabel } from "@/lib/plugin-utils";

import {
    capabilityLabel,
    configurationFields,
    contributionSummary,
    domainLabel,
    pluginContributions,
    pluginDomains,
    pluginRequirements,
    requirementLabel,
    type PluginRecord,
} from "../lib";

function DetailList({
    title,
    items,
}: {
    title: string;
    items: string[] | undefined;
}) {
    if (!items?.length) return null;
    return (
        <section>
            <h3 className="text-sm font-semibold">{title}</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[var(--vms-ink-muted)]">
                {items.map((item) => (
                    <li key={item} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function PluginOverview({ plugin }: { plugin: PluginRecord }) {
    const requirements = pluginRequirements(plugin);
    const contributions = pluginContributions(plugin);
    const domains = pluginDomains(plugin);
    const summary = contributionSummary(plugin);
    const organizationFields = configurationFields(plugin, "organization");
    const siteFields = configurationFields(plugin, "site");
    const documentationUrl = plugin.details?.documentationUrl;

    return (
        <div className="space-y-6 p-5">
            <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
                {plugin.description || "Organization business plugin."}
            </p>

            <dl className="grid grid-cols-2 gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 text-sm">
                <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                        Version
                    </dt>
                    <dd className="mt-1 font-medium">{plugin.version}</dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                        Category
                    </dt>
                    <dd className="mt-1 font-medium">
                        {plugin.category ? titleCase(plugin.category) : "—"}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                        Plan
                    </dt>
                    <dd className="mt-1 font-medium">
                        {pluginEntitlementLabel(plugin.entitlement_status ?? "free")}
                        {plugin.plan_name ? ` · ${plugin.plan_name}` : ""}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                        Configuration
                    </dt>
                    <dd className="mt-1 font-medium">
                        {organizationFields.length + siteFields.length === 0
                            ? "None declared"
                            : `${organizationFields.length} organization · ${siteFields.length} site`}
                    </dd>
                </div>
            </dl>

            {domains.length ? (
                <section>
                    <h3 className="text-sm font-semibold">Supported domains</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {domains.map((domain) => (
                            <Badge key={domain} variant="secondary">
                                {domainLabel(domain)}
                            </Badge>
                        ))}
                    </div>
                </section>
            ) : null}

            <section>
                <h3 className="text-sm font-semibold">Provider requirements</h3>
                {requirements.length ? (
                    <ul className="mt-2 space-y-2">
                        {requirements.map((requirement) => (
                            <li
                                key={requirement.key}
                                className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 py-2"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm font-medium">
                                        {requirementLabel(requirement)}
                                    </span>
                                    <Badge variant={requirement.required === false ? "outline" : "info"}>
                                        {requirement.required === false ? "Optional" : "Required"}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                                    {capabilityLabel(requirement.capability)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
                        This plugin declares no provider requirement.
                    </p>
                )}
            </section>

            <section>
                <h3 className="text-sm font-semibold">Workspace contributions</h3>
                <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                    {summary.navigation + summary.dashboard + summary.actions === 0
                        ? "No navigation, dashboard or action contribution is declared."
                        : `${summary.navigation} navigation · ${summary.dashboard} dashboard · ${summary.actions} action`}
                </p>
                {contributions.length ? (
                    <ul className="mt-2 space-y-2">
                        {contributions.map((contribution) => (
                            <li
                                key={`${contribution.workspace}:${contribution.key}`}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 py-2 text-sm"
                            >
                                <span className="font-medium">
                                    {contribution.label || contribution.key}
                                </span>
                                <span className="text-xs text-[var(--vms-ink-muted)]">
                                    {titleCase(contribution.workspace)} workspace ·{" "}
                                    {contribution.route || contribution.metric || "action"}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </section>

            <DetailList title="Use cases" items={plugin.details?.useCases} />
            <DetailList title="Setup steps" items={plugin.details?.setupSteps} />

            {documentationUrl ? (
                <a
                    href={documentationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                >
                    Documentation
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                </a>
            ) : null}
        </div>
    );
}
