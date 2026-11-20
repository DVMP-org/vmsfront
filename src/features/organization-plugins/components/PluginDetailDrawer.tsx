"use client";

import { useEffect, useState } from "react";
import { Puzzle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";

import { pluginTitle, type PluginRecord } from "../lib";
import {
    useOrganizationIntegrations,
    useOrganizationSites,
    usePluginDeploymentActions,
    usePluginDetail,
    usePluginHealthCheck,
    usePluginSites,
} from "../queries";
import { PluginConfigurationForm } from "./PluginConfigurationForm";
import { PluginDeploymentsPanel } from "./PluginDeploymentsPanel";
import { PluginIntegrationsPanel } from "./PluginIntegrationsPanel";
import { PluginOverview } from "./PluginOverview";
import { TabStrip } from "./TabStrip";

type DetailTab = "overview" | "integrations" | "configuration" | "deployments";

const TABS: Array<{ id: DetailTab; label: string; installedOnly?: boolean }> = [
    { id: "overview", label: "Overview" },
    { id: "integrations", label: "Integrations" },
    { id: "configuration", label: "Configuration", installedOnly: true },
    { id: "deployments", label: "Deployments", installedOnly: true },
];

export function PluginDetailDrawer({
    organizationId,
    plugin,
    installed,
    actionPending,
    onClose,
    onAction,
}: {
    organizationId: string;
    plugin: PluginRecord;
    installed: boolean;
    actionPending: boolean;
    onClose: () => void;
    onAction: () => void;
}) {
    const [tab, setTab] = useState<DetailTab>("overview");
    const activeId = installed ? plugin.id : null;
    const detail = usePluginDetail(organizationId, activeId);
    const sites = usePluginSites(organizationId, activeId);
    const integrations = useOrganizationIntegrations(organizationId, installed);
    const siteOptions = useOrganizationSites(organizationId, installed);
    const deploymentActions = usePluginDeploymentActions(organizationId, activeId);
    const healthCheck = usePluginHealthCheck(activeId);
    const record = detail.data ?? plugin;

    useEffect(() => {
        setTab("overview");
    }, [plugin.id]);

    const tabs = TABS.filter((entry) => installed || !entry.installedOnly);
    const primaryDisabled = installed
        ? actionPending || (!plugin.enabled && !plugin.can_enable)
        : actionPending || !plugin.can_install;

    return (
        <Drawer
            isOpen
            onClose={onClose}
            icon={Puzzle}
            eyebrow="Plugin"
            title={pluginTitle(plugin)}
            description={
                plugin.description || "Organization business plugin."
            }
            className="max-w-2xl"
            contentClassName="p-0"
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button disabled={primaryDisabled} onClick={onAction}>
                        {actionPending
                            ? installed
                                ? "Updating…"
                                : "Installing…"
                            : installed
                                ? plugin.enabled
                                    ? "Disable for organization"
                                    : "Enable for organization"
                                : "Install plugin"}
                    </Button>
                </div>
            }
        >
            <div className="sticky top-0 z-10 border-b border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 py-2">
                <TabStrip<DetailTab>
                    items={tabs.map((entry) => ({ id: entry.id, label: entry.label }))}
                    value={tab}
                    onChange={setTab}
                    label="Plugin detail sections"
                    panelId="plugin-detail-panel"
                    variant="inline"
                />
            </div>

            <div
                id="plugin-detail-panel"
                role="tabpanel"
                aria-labelledby={`plugin-detail-panel-tab-${tab}`}
            >
                {tab === "overview" ? <PluginOverview plugin={record} /> : null}

                {tab === "integrations" ? (
                    <PluginIntegrationsPanel
                        plugin={record}
                        sites={sites.data ?? []}
                        integrations={integrations.data ?? []}
                        isLoading={sites.isLoading}
                    />
                ) : null}

                {tab === "configuration" ? (
                    detail.isLoading ? (
                        <p role="status" className="p-5 text-sm text-[var(--vms-ink-muted)]">
                            Loading configuration…
                        </p>
                    ) : detail.isError ? (
                        <div role="alert" className="space-y-3 p-5">
                            <p className="text-sm">Configuration could not be loaded.</p>
                            <Button variant="outline" onClick={() => detail.refetch()}>
                                Retry
                            </Button>
                        </div>
                    ) : detail.data ? (
                        <PluginConfigurationForm
                            organizationId={organizationId}
                            plugin={detail.data}
                        />
                    ) : null
                ) : null}

                {tab === "deployments" ? (
                    <PluginDeploymentsPanel
                        plugin={record}
                        sites={sites.data ?? []}
                        sitesLoading={siteOptions.isLoading}
                        isLoading={sites.isLoading}
                        isError={sites.isError}
                        onRetry={() => sites.refetch()}
                        siteOptions={(siteOptions.data ?? []).map((site) => ({
                            id: site.id,
                            name: site.name,
                        }))}
                        integrations={integrations.data ?? []}
                        actions={deploymentActions}
                        health={healthCheck.data}
                        onCheckHealth={() => healthCheck.mutate()}
                    />
                ) : null}
            </div>
        </Drawer>
    );
}
