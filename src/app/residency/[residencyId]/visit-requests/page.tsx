"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useResident, useResidentVisitRequests } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";

import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Column, DataTable, FilterConfig, FilterDefinition } from "@/components/ui/DataTable";
import { ClipboardList, Home as HomeIcon } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { PaginationBar } from "@/components/ui/PaginationBar";
import type { VisitResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { formatFiltersForAPI } from "@/lib/table-utils";

const PAGE_SIZE = 10;

export default function VisitRequestsPage() {
    const router = useRouter();
    const params = useParams<{ residencyId?: string }>();
    const rawResidencyId = params?.residencyId;
    const routeResidencyId = Array.isArray(rawResidencyId) ? rawResidencyId[0] : rawResidencyId;
    const residencyId = routeResidencyId || "";
    const { selectedResidency, setSelectedResidency } = useAppStore();
    const { data: profile } = useProfile();

    const config = useMemo(() => ({
        page: { defaultValue: 1 },
        pageSize: { defaultValue: PAGE_SIZE },
        search: { defaultValue: "" },
        sort: { defaultValue: null },
        status: { defaultValue: "" },
        startDate: { defaultValue: "" },
        endDate: { defaultValue: "" },
    }), []);

    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config,
        skipInitialSync: true,
    });

    const isInitialMount = useRef(true);
    const [page, setPage] = useState(() => initializeFromUrl("page"));
    const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
    const [search, setSearch] = useState(() => initializeFromUrl("search"));
    const [sort, setSort] = useState(() => initializeFromUrl("sort"));
    const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("status"));
    const [startDate, setStartDate] = useState<string | undefined>(() => initializeFromUrl("startDate"));
    const [endDate, setEndDate] = useState<string | undefined>(() => initializeFromUrl("endDate"));

    // Sync state changes to URL (skip initial mount)
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
            startDate,
            endDate
        });
    }, [page, pageSize, search, sort, status, startDate, endDate, syncToUrl]);

    const activeFilters = useMemo(() => {
        const filters: FilterConfig[] = [];

        if (status) {
            filters.push({ field: "status", operator: "eq", value: status });
        }
        if (startDate) {
            filters.push({ field: "created_at", operator: "gte", value: startDate });
        }
        if (endDate) {
            filters.push({ field: "created_at", operator: "lte", value: endDate });
        }
        return filters;
    }, [status, startDate, endDate]);

    const availableFilters: FilterDefinition[] = useMemo(() => {
        const filters: FilterDefinition[] = [
            {
                field: "status",
                label: "Status",
                type: "select",
                options: [
                    { label: "Pending", value: "pending" },
                    { label: "Approved", value: "approved" },
                    { label: "Declined", value: "declined" },
                ],
            },
            {
                field: "created_at",
                label: "Created Between",
                type: "date-range",
            },
        ];
        return filters;
    }, []);


    const { data: paginatedVisitRequests, isLoading, isFetching } = useResidentVisitRequests(
        {
            page,
            pageSize,
            search: search.trim(),
            sort: sort,
            filters: formatFiltersForAPI(activeFilters),
        }
    );

    useEffect(() => {
        if (!routeResidencyId || !profile?.residencies) return;
        if (selectedResidency?.id === routeResidencyId) return;
        const match = profile.residencies.find((residency) => residency.id === routeResidencyId);
        if (match) {
            setSelectedResidency(match);
        }
    }, [routeResidencyId, profile?.residencies, selectedResidency?.id, setSelectedResidency]);

    useEffect(() => {
        setPage(1);
    }, [residencyId]);

    // Ensure visit requests is always an array
    const visitRequests = useMemo(() => {
        if (!paginatedVisitRequests) return [];

        if (Array.isArray(paginatedVisitRequests)) {
            return paginatedVisitRequests;
        }

        const items = paginatedVisitRequests?.items;
        if (!items) return [];
        if (!Array.isArray(items)) return [];
        return items;
    }, [paginatedVisitRequests]);

    const getStatusBadge = (status?: string) => {
        const normalizedStatus = status?.toLowerCase() || "pending";

        switch (normalizedStatus) {
            case "approved":
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Approved</Badge>;
            case "declined":
                return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Declined</Badge>;
            case "pending":
            default:
                return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Pending</Badge>;
        }
    };

    const visitRequestColumns: Column<VisitResponse>[] = [
        {
            key: "name",
            header: "Visitor Name",
            sortable: true,
            className: "font-medium",
        },
        {
            key: "email",
            header: "Email",
            accessor: (row) => row.email || "-",
        },
        {
            key: "phone",
            header: "Phone",
            accessor: (row) => row.phone || "-",
        },
        {
            key: "purpose",
            header: "Purpose",
            accessor: (row) => (
                <span className="text-sm line-clamp-1" title={row.purpose}>
                    {row.purpose}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            accessor: (row) => getStatusBadge(row.status),
        },
        {
            key: "created_at",
            header: "Requested",
            sortable: true,
            accessor: (row) => (
                <span className="text-sm text-muted-foreground">
                    {formatDateTime(row.created_at)}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/residency/${residencyId}/visit-requests/${row.id}`)}
                >
                    View Details
                </Button>
            ),
            className: "text-right",
        },
    ];

    if (!residencyId) {
        return (
            <Card>
                <CardContent className="p-10">
                    <EmptyState
                        icon={HomeIcon}
                        title="Select a residency to continue"
                        description="Choose a residency from the dashboard selector to view visit requests."
                        action={{
                            label: "Choose Residency",
                            onClick: () => router.push("/select"),
                        }}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Visit Requests</h1>
                <p className="text-muted-foreground">
                    Manage visitor requests for your residency
                </p>
            </div>

            <Card>
                <CardContent className="p-6">
                    <DataTable
                        data={Array.isArray(visitRequests) ? visitRequests : []}
                        columns={visitRequestColumns}
                        searchable
                        showPagination={false}
                        emptyMessage="No visit requests found"
                        searchPlaceholder="Search by visitor name, email, phone..."
                        onPageChange={setPage}
                        onPageSizeChange={(newPageSize) => {
                            setPage(1);
                            setPageSize(newPageSize);
                        }}
                        initialFilters={activeFilters}
                        availableFilters={availableFilters}
                        onFiltersChange={(filters) => {
                            setPage(1);
                            const statusFilter = filters.find((f) => f.field === "status");
                            const startDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "gte");
                            const endDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "lte");

                            setStatus(statusFilter?.value as string | undefined || undefined);
                            setStartDate(startDateFilter?.value as string | undefined || undefined);
                            setEndDate(endDateFilter?.value as string | undefined || undefined);
                        }}
                        onSortChange={(sort) => {
                            setPage(1);
                            setSort(sort);
                        }}
                        onSearchChange={(search) => {
                            setPage(1);
                            setSearch(search);
                        }}
                        isLoading={isLoading || isFetching}
                        initialSort={sort}
                        initialSearch={search}
                        disableClientSideFiltering={true}
                        disableClientSideSorting={true}
                    />
                    <PaginationBar
                        page={page}
                        pageSize={pageSize}
                        total={paginatedVisitRequests?.total ?? visitRequests.length}
                        totalPages={paginatedVisitRequests?.total_pages ?? 1}
                        hasNext={
                            paginatedVisitRequests?.has_next ??
                            page < (paginatedVisitRequests?.total_pages ?? 0)
                        }
                        hasPrevious={
                            paginatedVisitRequests?.has_previous ?? page > 1
                        }
                        isFetching={isFetching}
                        resourceLabel="visit requests"
                        onChange={(next) => setPage(next)}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
