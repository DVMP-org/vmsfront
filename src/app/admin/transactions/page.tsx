"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminTransactions } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, FilterDefinition } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CreditCard, Eye, Search, FilterX } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, titleCase } from "@/lib/utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { Transaction, TransactionType } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 20;

const TRANSACTION_TYPE_OPTIONS = Object.entries(TransactionType).map(([key, value]) => ({
    value,
    label: titleCase(value),
}));

export default function TransactionsPage() {
    const router = useRouter();

    // URL query sync
    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config: {
            page: { defaultValue: 1 },
            pageSize: { defaultValue: PAGE_SIZE },
            search: { defaultValue: "" },
            type: { defaultValue: undefined },
            status: { defaultValue: undefined },
            sort: { defaultValue: undefined },
            dateFrom: { defaultValue: undefined },
            dateTo: { defaultValue: undefined },
        },
        skipInitialSync: true,
    });

    const [page, setPage] = useState(() => initializeFromUrl("page"));
    const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
    const [search, setSearch] = useState(() => initializeFromUrl("search"));
    const [type, setType] = useState<string | undefined>(() => initializeFromUrl("type"));
    const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("status"));
    const [sort, setSort] = useState<string | null>(() => {
        const sortParam = initializeFromUrl("sort");
        return sortParam || null;
    });
    const [dateFrom, setDateFrom] = useState<string | undefined>(() => initializeFromUrl("dateFrom"));
    const [dateTo, setDateTo] = useState<string | undefined>(() => initializeFromUrl("dateTo"));

    useEffect(() => {
        syncToUrl({ page, pageSize, search, type, status, sort, dateFrom, dateTo });
    }, [page, pageSize, search, type, status, sort, dateFrom, dateTo, syncToUrl]);

    // Available filters for the DataTable
    const availableFilters: FilterDefinition[] = useMemo(() => [
        {
            field: "type",
            label: "Type",
            type: "select",
            options: [
                ...TRANSACTION_TYPE_OPTIONS
            ],
            operator: "eq",
        },
        {
            field: "status",
            label: "Status",
            type: "select",
            options: [
                { value: "success", label: "Success" },
                { value: "pending", label: "Pending" },
                { value: "failed", label: "Failed" },
            ],
            operator: "eq",
        },
        {
            field: "created_at",
            label: "Created Between",
            type: "date-range",
        }
    ], []);

    // Initial filters for DataTable
    const initialFilters = useMemo(() => {
        const filters = [];
        if (type) filters.push({ field: "type", operator: "eq" as const, value: type });
        if (status) filters.push({ field: "status", operator: "eq" as const, value: status });

        // Match the DataTable internal key pattern for date-range
        if (dateFrom) filters.push({ field: "created_at", operator: "gte" as const, value: dateFrom });
        if (dateTo) filters.push({ field: "created_at", operator: "lte" as const, value: dateTo });

        return filters;
    }, [type, status, dateFrom, dateTo]);

    const { data, isLoading, isFetching } = useAdminTransactions({
        page,
        pageSize,
        search: search.trim() || undefined,
        filters: formatFiltersForAPI(initialFilters),
        sort: sort || undefined,
    });

    const transactions = data?.items || [];
    const total = data?.total || 0;

    const columns: Column<Transaction>[] = [
        {
            key: "reference",
            header: "Reference",
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold uppercase tracking-tight">{row.reference}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(row.created_at)}</span>
                </div>
            ),
        },
        {
            key: "type",
            header: "Type",
            accessor: (row) => (
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">
                    {titleCase(row.type)}
                </Badge>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            accessor: (row) => (
                <span className="font-bold tabular-nums">
                    {formatCurrency(row.amount)}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            accessor: (row) => {
                const variants: Record<string, "success" | "warning" | "danger" | "secondary"> = {
                    success: "success",
                    pending: "warning",
                    failed: "danger",
                };
                return (
                    <Badge variant={variants[row.status] || "secondary"} className="text-[10px] font-bold uppercase">
                        {row.status}
                    </Badge>
                );
            },
        },
        {
            key: "processor",
            header: "Processor",
            accessor: (row) => (
                <span className="text-xs text-muted-foreground capitalize">
                    {row.processor || "—"}
                </span>
            ),
        },
        {
            key: "paid_at",
            header: "Paid At",
            sortable: true,
            accessor: (row) => (
                <span className="text-xs text-muted-foreground capitalize">
                    {row.paid_at ? formatDateTime(row.paid_at) : "—"}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/transactions/${row.id}`)}
                        className="h-8 group"
                    >
                        <Eye className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-brand-primary" />
                        <span className="text-xs group-hover:text-brand-primary">View</span>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">System Transactions</h1>
                    <p className="text-muted-foreground">Monitor and audit all payments and ledger entries.</p>
                </div>
            </div>

            <Card className="rounded-lg shadow-none border-border/60">
                <CardContent className="p-0">
                    {isLoading || isFetching ? (
                        <div className="p-6">
                            <TableSkeleton />
                        </div>
                    ) : (
                        <DataTable
                            data={transactions}
                            columns={columns}
                            searchable={true}
                            searchPlaceholder="Search by reference..."
                            pageSize={pageSize}
                            pageSizeOptions={PAGE_SIZE_OPTIONS}
                            onPageSizeChange={(s) => {
                                setPage(1);
                                setPageSize(s);
                            }}
                            showPagination={true}
                            emptyMessage="No transactions found matching your criteria"
                            serverSide={true}
                            total={total}
                            currentPage={page}
                            onPageChange={setPage}
                            initialSearch={search}
                            onSearchChange={(value) => {
                                setPage(1);
                                setSearch(value);
                            }}
                            availableFilters={availableFilters}
                            initialFilters={initialFilters}
                            onFiltersChange={(filters) => {
                                setPage(1);
                                const typeFilter = filters.find((f) => f.field === "type");
                                const statusFilter = filters.find((f) => f.field === "status");

                                // DataTable uses field_from and field_to internally for date-range
                                // But they are passed back as individual filters if mapped that way
                                // Actually handleFilterChange updates the filterValues map
                                // DataTable.tsx: handleFilterChange(`${filterDef.field}_from`, ...)
                                const dateFromFilter = filters.find((f) => f.field === "created_at" && f.operator === "gte");
                                const dateToFilter = filters.find((f) => f.field === "created_at" && f.operator === "lte");

                                setType(typeFilter?.value as string | undefined || undefined);
                                setStatus(statusFilter?.value as string | undefined || undefined);
                                setDateFrom(dateFromFilter?.value as string | undefined || undefined);
                                setDateTo(dateToFilter?.value as string | undefined || undefined);
                            }}
                            initialSort={sort}
                            onSortChange={(newSort) => {
                                setPage(1);
                                setSort(newSort);
                            }}
                            className="border-none"
                            disableClientSideFiltering={true}
                            disableClientSideSorting={true}
                            isLoading={isLoading || isFetching}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
