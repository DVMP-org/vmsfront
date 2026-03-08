"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Eye, Plus, XCircle } from "lucide-react";

import {
    useAcknowledgeEmergency,
    useAdminEmergencies,
    useResolveEmergency,
    useTriggerEmergencyAdmin,
} from "@/hooks/use-emergency";
import {
    EmergencySeverityBadge,
    EmergencyStatusBadge,
    EmergencyTypeLabel,
} from "@/components/emergencies/EmergencyBadge";
import { TriggerEmergencyModal } from "@/components/emergencies/TriggerEmergencyModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
    Column,
    DataTable,
    FilterConfig,
    FilterDefinition,
} from "@/components/ui/DataTable";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { Emergency, TriggerEmergencyRequest } from "@/types";

// ── Per-row action cell ─────────────────────────────────────────────────────
function EmergencyRowActions({ emergency }: { emergency: Emergency }) {
    const router = useRouter();
    const acknowledge = useAcknowledgeEmergency();
    const resolve = useResolveEmergency();

    return (
        <div className="flex items-center gap-1.5">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => router.push(`/admin/emergencies/${emergency.id}`)}
                title="View details"
            >
                <Eye className="h-4 w-4" />
            </Button>

            {emergency.status === "active" && (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-yellow-700 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-950 gap-1"
                    disabled={acknowledge.isPending}
                    onClick={() => acknowledge.mutate(emergency.id)}
                    title="Acknowledge"
                >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Acknowledge
                </Button>
            )}

            {(emergency.status === "active" || emergency.status === "acknowledged") && (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950 gap-1"
                    disabled={resolve.isPending}
                    onClick={() => resolve.mutate(emergency.id)}
                    title="Resolve"
                >
                    <XCircle className="h-3.5 w-3.5" />
                    Resolve
                </Button>
            )}
        </div>
    );
}

const PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const EMERGENCY_TYPE_OPTIONS = [
    { value: "fire", label: "🔥 Fire" },
    { value: "medical", label: "🏥 Medical" },
    { value: "security", label: "🚨 Security" },
    { value: "natural_disaster", label: "🌪 Natural Disaster" },
    { value: "other", label: "⚠️ Other" },
];

const SEVERITY_OPTIONS = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "🔴 Critical" },
];

const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "acknowledged", label: "Acknowledged" },
    { value: "resolved", label: "Resolved" },
];

export default function AdminEmergenciesPage() {
    const router = useRouter();

    const config = useMemo(
        () => ({
            page: { defaultValue: 1 },
            pageSize: { defaultValue: PAGE_SIZE },
            search: { defaultValue: undefined },
            sort: { defaultValue: "-created_at" },
            status: { defaultValue: undefined },
            emergency_type: { defaultValue: undefined },
            severity: { defaultValue: undefined },
        }),
        []
    );

    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config,
        skipInitialSync: true,
    });

    const isInitialMount = useRef(true);
    const [page, setPage] = useState(() => initializeFromUrl("page"));
    const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
    const [search, setSearch] = useState(() => initializeFromUrl("search") || "");
    const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));
    const [status, setStatus] = useState<string | undefined>(
        () => initializeFromUrl("status")
    );
    const [emergencyType, setEmergencyType] = useState<string | undefined>(
        () => initializeFromUrl("emergency_type")
    );
    const [severity, setSeverity] = useState<string | undefined>(
        () => initializeFromUrl("severity")
    );
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        syncToUrl({
            page,
            pageSize,
            search,
            sort,
            status,
            emergency_type: emergencyType,
            severity,
        });
    }, [page, pageSize, search, sort, status, emergencyType, severity, syncToUrl]);

    const activeFilters = useMemo(() => {
        const filters: FilterConfig[] = [];
        if (status) filters.push({ field: "status", value: status, operator: "eq" });
        if (emergencyType)
            filters.push({ field: "emergency_type", value: emergencyType, operator: "eq" });
        if (severity)
            filters.push({ field: "severity", value: severity, operator: "eq" });
        return filters;
    }, [status, emergencyType, severity]);

    const availableFilters: FilterDefinition[] = useMemo(
        () => [
            {
                field: "status",
                label: "Status",
                type: "select",
                isSearchable: false,
                options: STATUS_OPTIONS,
                operator: "eq",
            },
            {
                field: "emergency_type",
                label: "Type",
                type: "select",
                isSearchable: false,
                options: EMERGENCY_TYPE_OPTIONS,
                operator: "eq",
            },
            {
                field: "severity",
                label: "Severity",
                type: "select",
                isSearchable: false,
                options: SEVERITY_OPTIONS,
                operator: "eq",
            },
        ],
        []
    );

    const { data, isLoading, isFetching } = useAdminEmergencies({
        page,
        pageSize,
        search: search.trim() || undefined,
        sort: sort || undefined,
        status,
        emergency_type: emergencyType,
        severity,
    });

    const emergencies = useMemo(() => data?.items ?? [], [data?.items]);
    const total = data?.total ?? 0;

    const trigger = useTriggerEmergencyAdmin();
    const handleTrigger = useCallback(
        (formData: TriggerEmergencyRequest) => {
            trigger.mutate(formData, {
                onSuccess: () => setIsModalOpen(false),
            });
        },
        [trigger]
    );

    const columns: Column<Emergency>[] = [
        {
            key: "type",
            header: "Type",
            sortable: true,
            accessor: (row) => <EmergencyTypeLabel type={row.type} />,
        },
        {
            key: "severity",
            header: "Severity",
            sortable: true,
            accessor: (row) => <EmergencySeverityBadge severity={row.severity} />,
        },
        {
            key: "location",
            header: "Location / Detail",
            accessor: (row) => (
                <div className="flex flex-col max-w-[240px]">
                    <span className="text-sm font-medium truncate">
                        {row.location || <span className="italic text-muted-foreground">No location</span>}
                    </span>
                    {row.description && (
                        <span className="text-xs text-muted-foreground truncate">
                            {row.description}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "triggered_by",
            header: "Triggered By",
            accessor: (row) => (
                <span className="text-sm">
                    {row.triggered_by
                        ? `${row.triggered_by.first_name ?? ""} ${row.triggered_by.last_name ?? ""}`.trim() ||
                        row.triggered_by.email
                        : <span className="italic text-muted-foreground">—</span>}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            accessor: (row) => <EmergencyStatusBadge status={row.status} />,
        },
        {
            key: "created_at",
            header: "Reported",
            sortable: true,
            accessor: (row) => (
                <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            accessor: (row) => <EmergencyRowActions emergency={row} />,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        Emergencies
                    </h1>
                    <p className="text-muted-foreground">
                        {total > 0
                            ? `${total} emergency record${total !== 1 ? "s" : ""}`
                            : "Monitor and manage community emergency alerts"}
                    </p>
                </div>
                <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Trigger Alert
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <DataTable
                        data={emergencies}
                        columns={columns}
                        searchable={true}
                        searchPlaceholder="Search description, location, type..."
                        pageSize={pageSize}
                        pageSizeOptions={PAGE_SIZE_OPTIONS}
                        onPageSizeChange={(newSize) => {
                            setPage(1);
                            setPageSize(newSize);
                        }}
                        showPagination={true}
                        serverSide={true}
                        total={total}
                        currentPage={page}
                        onPageChange={setPage}
                        initialSearch={search}
                        availableFilters={availableFilters}
                        initialFilters={activeFilters}
                        onFiltersChange={(filters) => {
                            setPage(1);
                            setStatus(filters.find((f) => f.field === "status")?.value as string);
                            setEmergencyType(
                                filters.find((f) => f.field === "emergency_type")?.value as string
                            );
                            setSeverity(
                                filters.find((f) => f.field === "severity")?.value as string
                            );
                        }}
                        onSearchChange={(value) => {
                            setPage(1);
                            setSearch(value);
                        }}
                        onSortChange={(newSort) => {
                            setPage(1);
                            setSort(newSort);
                        }}
                        isLoading={isLoading || isFetching}
                    />
                </CardContent>
            </Card>

            <TriggerEmergencyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleTrigger}
                isLoading={trigger.isPending}
            />
        </div>
    );
}
