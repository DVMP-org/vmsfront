"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { integrationService } from "@/services/integration-service";
import {
    Integration,
    IntegrationType,
    INTEGRATION_TYPE_LABELS,
} from "@/types/integration";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
    TableCell,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import {
    IntegrationTypeBadge,
    IntegrationStatusToggle,
} from "../integrations/components";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import {
    Puzzle,
    Search,
    Loader2,
    X,
    Settings,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
} from "lucide-react";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { FilterConfig } from "@/components/ui/DataTable";
import { useDisableIntegration, useEnableIntegration, useIntegrations } from "@/hooks/use-integrations";
import { titleCase } from "@/lib/utils";

export default function IntegrationsSection() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config: {
            search: { defaultValue: "" },
            type: { defaultValue: "" },
            status: { defaultValue: "" },
            sort: { defaultValue: "~created_at" },
            page: { defaultValue: 1, deserialize: (value) => parseInt(value || "1", 10) },
        },
    });

    const [searchQuery, setSearchQuery] = useState(() => initializeFromUrl("search"));
    const [filterType, setFilterType] = useState(() => initializeFromUrl("type"));
    const [filterStatus, setFilterStatus] = useState(() => initializeFromUrl("status"));
    const [sort, setSort] = useState(() => initializeFromUrl("sort"));
    const [page, setPage] = useState(() => initializeFromUrl("page") || 1);

    useEffect(() => {
        syncToUrl({ search: searchQuery, type: filterType, status: filterStatus, sort, page });
    }, [searchQuery, filterType, filterStatus, sort, page, syncToUrl]);

    const filters: FilterConfig[] = [
        {
            field: "type",
            operator: "eq",
            value: filterType,
        },
        // Status filter is handled client-side since API doesn't support it directly
        {
            field: "status",
            operator: "eq",
            value: filterStatus,
        }
    ]
    // Fetch integrations
    const {
        data: integrationsResponse,
        isLoading,
    } = useIntegrations({
        page: page,
        pageSize: 100, // Fetch all for client-side filtering/sorting
        search: searchQuery,
        filters: formatFiltersForAPI(filters),
        sort: sort
    })

    const integrations = integrationsResponse?.items || [];

    // Filter by status client-side
    const filteredIntegrations = useMemo(() => {
        return integrations.filter((integration) => {
            if (filterStatus === "enabled") return integration.enabled;
            if (filterStatus === "disabled") return !integration.enabled;
            if (filterStatus === "configured") return integration.configured;
            if (filterStatus === "unconfigured") return !integration.configured;
            return true;
        });
    }, [integrations, filterStatus]);

    // Get unique integration types for filtering
    const integrationTypes = useMemo(() => {
        const types = new Set(integrations.map((i) => i.provider));
        return Array.from(types) as IntegrationType[];
    }, [integrations]);

    // Enable mutation
    const enableMutation = useEnableIntegration();

    // Disable mutation
    const disableMutation = useDisableIntegration();

    const handleToggle = (integration: Integration) => {
        // if (!integration.configured && !integration.enabled) {
        //     toast.error("Please configure credentials before enabling");
        //     router.push(`/admin/settings/integrations/${integration.id}`);
        //     return;
        // }

        if (integration.enabled) {
            disableMutation.mutate(integration.name);
        } else {
            enableMutation.mutate(integration.name);
        }
    };

    const handleConfigure = (integration: Integration) => {
        router.push(`/admin/settings/integrations/${integration.id}`);
    };

    const enabledCount = integrations.filter((i) => i.enabled).length;
    const configuredCount = integrations.filter((i) => i.configured).length;
    const isToggling = enableMutation.isPending || disableMutation.isPending;
    const togglingName = enableMutation.isPending
        ? enableMutation.variables
        : disableMutation.isPending
            ? disableMutation.variables
            : undefined;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <Puzzle className="h-4 w-4 text-zinc-600" />
                    <h1 className="text-lg font-semibold text-foreground">Integrations</h1>
                </div>
                <p className="text-xs text-muted-foreground">
                    Connect and manage third-party services
                </p>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{integrations.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Enabled:</span>
                    <span className="font-medium text-emerald-600">{enabledCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Configured:</span>
                    <span className="font-medium">{configuredCount}</span>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search integrations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
                        >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Type filters */}
                    <button
                        onClick={() => setFilterType("")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${!filterType
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                            }`}
                    >
                        All Types
                    </button>
                    {integrationTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(filterType === type ? "" : type)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${filterType === type
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                                }`}
                        >
                            {INTEGRATION_TYPE_LABELS[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilterStatus("")}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${!filterStatus
                        ? "bg-zinc-100 border-zinc-300 text-zinc-700"
                        : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilterStatus(filterStatus === "enabled" ? "" : "enabled")}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${filterStatus === "enabled"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                        }`}
                >
                    Enabled
                </button>
                <button
                    onClick={() => setFilterStatus(filterStatus === "disabled" ? "" : "disabled")}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${filterStatus === "disabled"
                        ? "bg-zinc-100 border-zinc-300 text-zinc-700"
                        : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                        }`}
                >
                    Disabled
                </button>
                <button
                    onClick={() => setFilterStatus(filterStatus === "unconfigured" ? "" : "unconfigured")}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${filterStatus === "unconfigured"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                        }`}
                >
                    Needs Setup
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredIntegrations.length === 0 && (
                <EmptyState
                    icon={Puzzle}
                    title="No integrations found"
                    description={
                        searchQuery || filterType || filterStatus
                            ? "Try adjusting your search or filter criteria."
                            : "No integrations are available at this time."
                    }
                />
            )}

            {/* Integrations Table */}
            {!isLoading && filteredIntegrations.length > 0 && (
                <div className="border border-zinc-200 rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[220px]">Integration</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[120px]">Type</TableHead>
                                <TableHead className="w-[130px]">Status</TableHead>
                                <TableHead className="w-[120px]">Configuration</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredIntegrations.map((integration) => (
                                <IntegrationRow
                                    key={integration.id}
                                    integration={integration}
                                    onToggle={() => handleToggle(integration)}
                                    onConfigure={() => handleConfigure(integration)}
                                    isToggling={isToggling && togglingName === integration.name}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

// Integration Row Component
function IntegrationRow({
    integration,
    onToggle,
    onConfigure,
    isToggling,
}: {
    integration: Integration;
    onToggle: () => void;
    onConfigure: () => void;
    isToggling: boolean;
}) {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    {integration?.logo_url ? (
                        <img
                            src={integration.logo_url}
                            alt={integration.name}
                            className="h-8 w-8 rounded object-contain bg-muted p-0.5"
                        />
                    ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground">
                                {integration.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                            {titleCase(integration.name)}
                        </p>
                        {integration.version && (
                            <p className="text-xs text-muted-foreground">v{integration.version}</p>
                        )}
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                    {integration.description || "No description available."}
                </p>
            </TableCell>
            <TableCell>
                <IntegrationTypeBadge type={integration.provider} />
            </TableCell>
            <TableCell>
                <IntegrationStatusToggle
                    enabled={integration.enabled}
                    onToggle={onToggle}
                    disabled={isToggling}
                    showLabel
                    size="sm"
                />
            </TableCell>
            <TableCell>
                {integration.configured ? (
                    <Badge variant="success" className="gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        Configured
                    </Badge>
                ) : (
                    <Badge variant="warning" className="gap-1 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        Needs Setup
                    </Badge>
                )}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onConfigure}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="Configure"
                    >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {integration.config?.website_url && (
                        <a
                            href={integration.config.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title="Visit Website"
                        >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}
