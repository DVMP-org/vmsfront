"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminTransactions } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  DataTable,
  type Column,
  type FilterConfig,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AlertCircle, CreditCard, Eye, RefreshCcw } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  titleCase,
} from "@/lib/utils";
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
        const filters: FilterConfig[] = [];
        if (type) filters.push({ field: "type", operator: "eq" as const, value: type });
        if (status) filters.push({ field: "status", operator: "eq" as const, value: status });

        // Match the DataTable internal key pattern for date-range
        if (dateFrom) filters.push({ field: "created_at", operator: "gte" as const, value: dateFrom });
        if (dateTo) filters.push({ field: "created_at", operator: "lte" as const, value: dateTo });

        return filters;
    }, [type, status, dateFrom, dateTo]);

    const { data, isLoading, isFetching, isError, error, refetch } =
      useAdminTransactions({
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

    const stale = isError && !!data;

    return (
        <div className="space-y-4 pb-10 text-[var(--vms-ink)]">
            <PageHeader
                eyebrow={
                    <span className="inline-flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5" aria-hidden />
                        Finance / Transactions
                    </span>
                }
                title="Transactions"
                description="Monitor payment attempts, settlement outcomes and ledger references for the selected property context."
                metadata={
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
                        <Badge variant="neutral">{formatNumber(total)} records</Badge>
                        <span>Newest records first</span>
                    </div>
                }
                primaryAction={
                    <Button
                        variant="secondary"
                        onClick={() => refetch()}
                        isLoading={isFetching}
                    >
                        {!isFetching ? (
                            <RefreshCcw className="h-4 w-4" aria-hidden />
                        ) : null}
                        Refresh
                    </Button>
                }
            />

            {stale ? (
                <div
                    role="alert"
                    className="flex flex-col gap-3 rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-warning)_35%,white)] bg-[var(--vms-warning-subtle)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                    <span>
                        The latest transaction request failed. The previous successful
                        page remains visible.
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        isLoading={isFetching}
                    >
                        Retry
                    </Button>
                </div>
            ) : null}

            {isLoading && !data ? (
                <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-6">
                    <TableSkeleton />
                </div>
            ) : isError && !data ? (
                <div
                    role="alert"
                    className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-5 text-sm"
                >
                    <p className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="h-4 w-4" aria-hidden />
                        Transactions are unavailable
                    </p>
                    <p className="mt-1 text-[var(--vms-ink-muted)]">
                        {(error as Error)?.message ||
                            "The transaction ledger could not be loaded."}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => refetch()}
                        isLoading={isFetching}
                    >
                        Retry
                    </Button>
                </div>
            ) : (
                <DataTable
                    data={transactions}
                    columns={columns}
                    searchable
                    searchPlaceholder="Search by reference…"
                    pageSize={pageSize}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                    onPageSizeChange={(size) => {
                        setPage(1);
                        setPageSize(size);
                    }}
                    showPagination
                    emptyMessage="No transactions match the current search and filters."
                    serverSide
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
                        const typeFilter = filters.find(
                            (filter) => filter.field === "type",
                        );
                        const statusFilter = filters.find(
                            (filter) => filter.field === "status",
                        );
                        const dateFromFilter = filters.find(
                            (filter) =>
                                filter.field === "created_at" &&
                                filter.operator === "gte",
                        );
                        const dateToFilter = filters.find(
                            (filter) =>
                                filter.field === "created_at" &&
                                filter.operator === "lte",
                        );
                        setType(
                            (typeFilter?.value as string | undefined) || undefined,
                        );
                        setStatus(
                            (statusFilter?.value as string | undefined) || undefined,
                        );
                        setDateFrom(
                            (dateFromFilter?.value as string | undefined) || undefined,
                        );
                        setDateTo(
                            (dateToFilter?.value as string | undefined) || undefined,
                        );
                    }}
                    initialSort={sort}
                    onSortChange={(nextSort) => {
                        setPage(1);
                        setSort(nextSort);
                    }}
                    disableClientSideFiltering
                    disableClientSideSorting
                    isLoading={isFetching}
                />
            )}
        </div>
    );
}
