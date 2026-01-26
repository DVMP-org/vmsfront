import { useEffect, useMemo, useRef, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { useVisitors } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Column, DataTable, FilterConfig, FilterDefinition } from "@/components/ui/DataTable";
import { Users, Home as HomeIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PaginationBar } from "@/components/ui/PaginationBar";
import type { Visitor } from "@/types";
import { Button } from "@/components/ui/Button";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";

const PAGE_SIZE = 10;

export default function VisitorsPage() {
    const router = useRouter();
    const { houseId: rawHouseId } = router.query;
    const routeHouseId = Array.isArray(rawHouseId) ? rawHouseId[0] : (rawHouseId as string | undefined);

    const { selectedHouse, setSelectedHouse } = useAppStore();
    const { data: profile } = useProfile();
    const houseId = routeHouseId ?? selectedHouse?.id ?? null;

    const config = useMemo(() => ({
        page: { defaultValue: 1 },
        pageSize: { defaultValue: PAGE_SIZE },
        search: { defaultValue: "" },
        sort: { defaultValue: null },
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
    const [startDate, setStartDate] = useState<string | undefined>(() => initializeFromUrl("startDate"));
    const [endDate, setEndDate] = useState<string | undefined>(() => initializeFromUrl("endDate"));

    useEffect(() => {
        if (!router.isReady) return;
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        syncToUrl({ page, pageSize, search, sort, startDate, endDate });
    }, [page, pageSize, search, sort, startDate, endDate, syncToUrl, router.isReady]);

    const activeFilters = useMemo(() => {
        const filters: FilterConfig[] = [];
        if (startDate) filters.push({ field: "created_at", operator: "gte", value: startDate });
        if (endDate) filters.push({ field: "created_at", operator: "lte", value: endDate });
        return filters;
    }, [startDate, endDate]);

    const { data: paginatedVisitors, isLoading, isFetching } = useVisitors(
        houseId,
        {
            page,
            pageSize,
            search: search.trim(),
            sort: sort,
            filters: formatFiltersForAPI(activeFilters),
        }
    );

    useEffect(() => {
        if (!routeHouseId || !profile?.houses) return;
        if (selectedHouse?.id === routeHouseId) return;
        const match = profile.houses.find((h) => h.id === routeHouseId);
        if (match) setSelectedHouse(match);
    }, [routeHouseId, profile?.houses, selectedHouse?.id, setSelectedHouse]);

    const visitors = useMemo(() => {
        if (!paginatedVisitors) return [];
        if (Array.isArray(paginatedVisitors)) return paginatedVisitors;
        return paginatedVisitors.items || [];
    }, [paginatedVisitors]);

    const visitorColumns: Column<Visitor>[] = [
        { key: "name", header: "Name", sortable: true, className: "font-medium" },
        { key: "email", header: "Email", accessor: (row) => row.email || "-" },
        { key: "phone", header: "Phone", accessor: (row) => row.phone || "-" },
        { key: "created_at", header: "Created", sortable: true, accessor: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.created_at)}</span> },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <Button variant="ghost" size="sm" onClick={() => router.push(`/house/${houseId}/visitors/${row.id}`)}>
                    View
                </Button>
            ),
            className: "text-right",
        },
    ];

    if (!router.isReady) return null;

    if (!houseId) {
        return (
            <Card>
                <CardContent className="p-10">
                    <EmptyState
                        icon={HomeIcon}
                        title="Select a house to continue"
                        description="Choose a house from the dashboard selector to view visitor history."
                        action={{ label: "Choose House", onClick: () => router.push("/select") }}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Visitors</h1>
                <p className="text-muted-foreground">View all your visitors</p>
            </div>
            <Card>
                <CardContent className="p-6">
                    <DataTable
                        data={visitors}
                        columns={visitorColumns}
                        searchable
                        showPagination={false}
                        emptyMessage="No visitors found"
                        searchPlaceholder="Search visitors..."
                        isLoading={isLoading || isFetching}
                        initialFilters={activeFilters}
                        availableFilters={[{ field: "created_at", label: "Created Between", type: "date-range" }]}
                        onFiltersChange={(filters) => {
                            setPage(1);
                            const sdf = filters.find((f) => f.field === "created_at" && f.operator === "gte");
                            const edf = filters.find((f) => f.field === "created_at" && f.operator === "lte");
                            setStartDate(sdf?.value as string | undefined);
                            setEndDate(edf?.value as string | undefined);
                        }}
                        onSortChange={(s) => { setPage(1); setSort(s); }}
                        onSearchChange={(s) => { setPage(1); setSearch(s); }}
                        initialSort={sort}
                        initialSearch={search}
                        disableClientSideFiltering={true}
                        disableClientSideSorting={true}
                    />
                    <PaginationBar
                        page={page}
                        pageSize={pageSize}
                        total={paginatedVisitors?.total ?? visitors.length}
                        totalPages={paginatedVisitors?.total_pages ?? 1}
                        hasNext={paginatedVisitors?.has_next ?? page < (paginatedVisitors?.total_pages ?? 0)}
                        hasPrevious={paginatedVisitors?.has_previous ?? page > 1}
                        isFetching={isFetching}
                        resourceLabel="visitors"
                        onChange={(next) => setPage(next)}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

VisitorsPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="resident">
                {page}
            </DashboardLayout>
        </RouteGuard>
    );
};
