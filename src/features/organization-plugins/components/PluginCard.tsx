"use client";

import { Puzzle } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { pluginEntitlementLabel } from "@/lib/plugin-utils";
import { titleCase } from "@/lib/strings";

import {
    capabilityLabel,
    domainLabel,
    pluginDomains,
    pluginRequirements,
    pluginStatus,
    pluginTitle,
    type PluginRecord,
} from "../lib";

export function PluginCard({
    plugin,
    installed,
    busy,
    pending,
    onOpen,
    onAction,
}: {
    plugin: PluginRecord;
    installed: boolean;
    busy: boolean;
    pending: boolean;
    onOpen: () => void;
    onAction: () => void;
}) {
    const status = pluginStatus(plugin);
    const domains = pluginDomains(plugin);
    const requirements = pluginRequirements(plugin);
    const primaryDisabled = installed
        ? busy || (!plugin.enabled && !plugin.can_enable)
        : busy || !plugin.can_install;

    return (
        <Card className="flex h-full min-w-0 flex-col transition-colors hover:border-[var(--vms-line-strong)]">
            <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]">
                        <Puzzle aria-hidden="true" className="h-5 w-5" />
                    </div>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                </div>

                <h2 className="mt-4 break-words text-base font-semibold leading-6">
                    {pluginTitle(plugin)}
                </h2>
                <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {plugin.category ? titleCase(plugin.category) : "Business tools"} ·
                    v{plugin.version}
                </p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--vms-ink-muted)]">
                    {plugin.description || "Organization business plugin."}
                </p>

                {domains.length ? (
                    <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Supported domains">
                        {domains.slice(0, 4).map((domain) => (
                            <Badge key={domain} variant="secondary">
                                {domainLabel(domain)}
                            </Badge>
                        ))}
                        {domains.length > 4 ? (
                            <Badge variant="outline">+{domains.length - 4}</Badge>
                        ) : null}
                    </div>
                ) : null}

                <p className="mt-3 text-xs text-[var(--vms-ink-muted)]">
                    {requirements.length
                        ? requirements
                            .map(
                                (requirement) =>
                                    `${capabilityLabel(requirement.capability)}${requirement.required === false ? " (optional)" : ""
                                    }`,
                            )
                            .join(" · ")
                        : "No provider requirement"}
                </p>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--vms-line)] pt-4">
                    <p className="text-xs font-semibold">
                        {pluginEntitlementLabel(plugin.entitlement_status ?? "free")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={onOpen}>
                            Details
                        </Button>
                        <Button disabled={primaryDisabled} onClick={onAction}>
                            {pending
                                ? installed
                                    ? "Updating…"
                                    : "Installing…"
                                : installed
                                    ? plugin.enabled
                                        ? "Disable"
                                        : "Enable"
                                    : "Install"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
