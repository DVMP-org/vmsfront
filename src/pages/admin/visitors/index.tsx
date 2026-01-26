"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef, ReactElement } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, Column, FilterConfig, FilterDefinition } from "@/components/ui/DataTable";
import { Eye, Search, Filter } from "lucide-react";
import { Visitor, VisitorStatus } from "@/types";
import { useAdminVisitors, useAdminHouses, useAdminGatePasses } from "@/hooks/use-admin";
import { Card, CardContent } from "@/components/ui/Card";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;

export default function AdminVisitorsPage() {
    const config = useMemo(() => ({
        page: { defaultValue: 1 },
        pageSize: { defaultValue: PAGE_SIZE },
        search: { defaultValue: undefined },
        sort: { defaultValue: "-created_at" },
        house_id: { defaultValue: undefined },
        gate_pass_id: { defaultValue: undefined },
        status: { defaultValue: undefined },
    }), []);

    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config,
        skipInitialSync: true,
    });
    const isInitialMount = useRef(true);
    const router = useRouter()

    const [page, setPage] = useState(() => initializeFromUrl("page"));
    const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
    const [search, setSearch] = useState(() => initializeFromUrl("search") || "");
    const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));
    const [houseId, setHouseId] = useState<string | undefined>(() => initializeFromUrl("house_id"));
    const [gatePassId, setGatePassId] = useState<string | undefined>(() => initializeFromUrl("gate_pass_id"));
    const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("status"));

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
            gate_pass_id: gatePassId,
            status,
            house_id: houseId,
        });
    }, [page, pageSize, search, sort, houseId, gatePassId, status, syncToUrl]);

    const { data: housesData } = useAdminHouses({ page: 1, pageSize: 100 });
    const houses = useMemo(() => housesData?.items ?? [], [housesData]);

    const { data: gatePassesData } = useAdminGatePasses({ page: 1, pageSize: 50 });
    const gatePasses = useMemo(() => gatePassesData?.items ?? [], [gatePassesData]);

    const activeFilters = useMemo(() => {
        const filters: FilterConfig[] = [];
        if (houseId) {
            filters.push({ field: "house_id", value: houseId, operator: "eq" });
        }
        if (gatePassId) {
            filters.push({ field: "gate_pass_id", value: gatePassId, operator: "eq" });
        }
        if (status) {
            filters.push({ field: "status", value: status, operator: "eq" });
        }
        return filters;
    }, [houseId, gatePassId, status]);

    const availableFilters: FilterDefinition[] = useMemo(() => {
        const filters: FilterDefinition[] = [
            {
                field: "status",
                label: "Status",
                type: "select",
                isSearchable: true,
                options: Object.values(VisitorStatus).map((status) => ({
                    value: status,
                    label: status,
                })),
                operator: "eq",
            }
        ];
        if (houses.length > 0) {
            filters.push({
                field: "house_id",
                label: "House",
                type: "select",
                isSearchable: true,
                options: houses.map((house) => ({
                    value: house.id,
                    label: house.name,
                })),
                operator: "eq",
            });
        }
        if (gatePasses.length > 0) {
            filters.push({
                field: "gate_pass_id",
                label: "Gate Pass",
                type: "select",
                isSearchable: true,
                options: gatePasses.map((gatePass) => ({
                    value: gatePass.id,
                    label: gatePass.code,
                })),
                operator: "eq",
            });
        }
        return filters;
    }, [houses, gatePasses, VisitorStatus]);

    const { data, isLoading, isFetching } = useAdminVisitors({
        page,
        pageSize,
        search: search.trim() || undefined,
        sort: sort || undefined,
        filters: formatFiltersForAPI(activeFilters),
    });

    const visitors = useMemo(() => data?.items ?? [], [data?.items]);
    const total = data?.total ?? 0;

    const columns: Column<Visitor>[] = [
        {
            key: "name",
            header: "Name",
            sortable: true,
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{row.id.split('-')[0]}</span>
                </div>
            ),
        },
        {
            key: "contact",
            header: "Contact Info",
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm">{row.email || <span className="text-muted-foreground italic">No email</span>}</span>
                    <span className="text-xs text-muted-foreground">{row.phone || "No phone"}</span>
                </div>
            ),
        },
        {
            key: "gate_pass",
            header: "Gate Pass",
            accessor: (row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {row.gate_pass_code || row.gate_pass?.code || "—"}
                        </code>
                        {row.pass_code_suffix && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-zinc-200">
                                +{row.pass_code_suffix}
                            </Badge>
                        )}
                    </div>
                    {row.gate_pass?.house_id && (
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                            House ID: {row.gate_pass.house_id.split('-')[0]}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            accessor: (row) => (
                <StatusBadge status={row?.status || VisitorStatus.PENDING} />
            ),
        },
        {
            key: "created_at",
            header: "First Seen",
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
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/visitors/${row.id}`)}
                        title="View Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Visitors Management</h1>
                    <p className="text-muted-foreground">
                        {total} total visitor{total !== 1 ? "s" : ""} recorded
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <DataTable
                        data={visitors}
                        columns={columns}
                        searchable={true}
                        searchPlaceholder="Search name, email, phone..."
                        pageSize={pageSize}
                        pageSizeOptions={PAGE_SIZE_OPTIONS}
                        onPageSizeChange={(newPageSize) => {
                            setPage(1);
                            setPageSize(newPageSize);
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
                            const houseFilter = filters.find(f => f.field === "house_id");
                            const statusFilter = filters.find(f => f.field === "status");
                            const gatePassFilter = filters.find(f => f.field === "gate_pass_id");
                            setHouseId(houseFilter?.value as string);
                            setStatus(statusFilter?.value as string);
                            setGatePassId(gatePassFilter?.value as string);
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
        </div>
    );
}

function StatusBadge({ status, className }: { status: string, className?: string }) {
    const statusMap: Record<string, { label: string; className: string }> = {
        [VisitorStatus.CHECKED_IN]: {
            label: "Checked in",
            className: cn("bg-orange-50 text-orange-600 border border-orange-600 w-fit", className),
        },
        [VisitorStatus.CHECKED_OUT]: {
            label: "Checked out",
            className: cn("bg-indigo-50 text-indigo-600 border border-indigo-600 w-fit", className),
        },
        [VisitorStatus.PENDING]: {
            label: "Pending",
            className: cn("bg-amber-50 text-amber-600 border border-amber-600 w-fit", className),
        },
        [VisitorStatus.REVOKED]: {
            label: "Revoked",
            className: cn("bg-red-50 text-red-600 border border-red-600 w-fit", className),
        },
        [VisitorStatus.IN_PROGRESS]: {
            label: "In Progress",
            className: cn("bg-green-50 text-green-600 border border-green-600 w-fit", className),
        },
    };


    const data = statusMap[status] ?? {
        label: status,
        className: cn("bg-muted text-muted-foreground border border-border w-fit", className),
    };

    return (
        <Badge variant="secondary" className={`${data.className} font-normal text-xs`}>
            {data.label}
        </Badge>
    );
}

AdminVisitorsPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="admin">
                <AdminPermissionGuard>
                    {page}
                </AdminPermissionGuard>
            </DashboardLayout>
        </RouteGuard>
    );
};
