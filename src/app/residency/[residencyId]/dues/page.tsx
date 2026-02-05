"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import { useResidencyDues } from "@/hooks/use-resident";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { DataTable, Column, FilterDefinition, FilterConfig } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Receipt, Wallet, ArrowRight, Eye } from "lucide-react";
import { DueTenureLength, ResidencyDue, ResidencyDueStatus } from "@/types";
import { cn } from "@/lib/utils";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatFiltersForAPI } from "@/lib/table-utils";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const PAGE_SIZE = 20;

export default function ResidentDuesPage() {
    const params = useParams<{ residencyId: string }>();
    const router = useRouter(); // Error check: next/navigation is standard in this project
    const residencyId = params?.residencyId ?? null;

    const config = useMemo(() => ({
        page: { defaultValue: 1 },
        pageSize: { defaultValue: PAGE_SIZE },
        search: { defaultValue: "" },
        sort: { defaultValue: undefined },
        status: { defaultValue: undefined },
        payment_breakdown: { defaultValue: undefined },
        startDate: { defaultValue: undefined },
        endDate: { defaultValue: undefined },
    }), []);

    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config,
        skipInitialSync: true,
    });
    const isInitialMount = useRef(true);
    const [page, setPage] = useState(() => initializeFromUrl("page"));
    const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
    const [search, setSearch] = useState(() => initializeFromUrl("search"));
    const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("status"));
    const [payment_breakdown, setPaymentBreakdown] = useState<string | undefined>(() => initializeFromUrl("payment_breakdown"));
    const [sort, setSort] = useState(() => initializeFromUrl("sort"));
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
            startDate,
            endDate,
            status,
            payment_breakdown,
        });
    }, [
        page,
        pageSize,
        search,
        sort,
        startDate,
        endDate,
        status,
        payment_breakdown,
        syncToUrl]);

    const activeFilters = useMemo(() => {
        const filters: FilterConfig[] = [];
        if (payment_breakdown) {
            filters.push({ field: "payment_breakdown", operator: "eq", value: payment_breakdown });
        }
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
    },
        [
            status,
            payment_breakdown,
            startDate,
            endDate
        ]
    );

    const availableFilters: FilterDefinition[] = useMemo(() => {
        const filters: FilterDefinition[] = [
            {
                field: "payment_breakdown",
                label: "Payment Breakdown",
                type: "select",
                options: [
                    { value: DueTenureLength.ONE_TIME, label: "One-time" },
                    { value: DueTenureLength.DAILY, label: "Daily" },
                    { value: DueTenureLength.WEEKLY, label: "Weekly" },
                    { value: DueTenureLength.MONTHLY, label: "Monthly" },
                    { value: DueTenureLength.QUARTERLY, label: "Quarterly" },
                    { value: DueTenureLength.BIANNUALLY, label: "Bi-Annually" },
                    { value: DueTenureLength.YEARLY, label: "Yearly" },
                ],
            },
            {
                field: "status",
                label: "Status",
                type: "select",
                options: [
                    { value: ResidencyDueStatus.PAID, label: "Paid" },
                    { value: ResidencyDueStatus.UNPAID, label: "Unpaid" },
                    { value: ResidencyDueStatus.PARTIALLY_PAID, label: "Partially Paid" },
                ],
            },
            {
                field: "created_at",
                label: "Created Between",
                type: "date-range",
            },
        ]
        return filters;
    }, []);



    const { data, isLoading, isFetching } = useResidencyDues(
        residencyId,
        {
            page,
            pageSize,
            search,
            sort,
            filters: activeFilters.length > 0 ? formatFiltersForAPI(activeFilters) : undefined
        }
    );

    const dues = useMemo(() => data?.items ?? [], [data]);
    const total = data?.total ?? 0;

    const columns: Column<ResidencyDue>[] = [
        {
            key: "name",
            header: "Due Description",
            sortable: true,
            accessor: (row) => (
                <div className="py-1">
                    <span className="font-semibold text-foreground block truncate max-w-[250px]">{row.due?.name || "Service Charge"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono tracking-tighter uppercase opacity-70">RID: {row.id.split('-')[0]}</span>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Total Amount",
            sortable: true,
            accessor: (row) => <span className="font-medium tabular-nums text-foreground">{formatCurrency(row.amount)}</span>,
        },
        {
            key: "balance",
            header: "Balance Remaining",
            sortable: true,
            accessor: (row) => (
                <span className={cn(
                    "font-bold tabular-nums",
                    row.balance > 0 ? "text-red-500" : "text-emerald-600"
                )}>
                    {formatCurrency(row.balance)}
                </span>
            ),
        },
        {
            key: "payment_breakdown",
            header: "Payment Breakdown",
            sortable: true,
            accessor: (row) => <span className="font-medium tabular-nums text-foreground">{titleCase(row.payment_breakdown)}</span>,
        },
        {
            key: "created_at",
            header: "Created At",
            sortable: true,
            accessor: (row) => <span className="font-medium tabular-nums text-foreground">{formatDate(row.created_at)}</span>,
        },
        {
            key: "status",
            header: "Payment Status",
            sortable: true,
            accessor: (row) => {
                const variants = {
                    [ResidencyDueStatus.PAID]: "success",
                    [ResidencyDueStatus.PARTIALLY_PAID]: "secondary",
                    [ResidencyDueStatus.UNPAID]: "danger",
                };
                return (
                    <Badge
                        variant={variants[row.status] as any}
                        className="text-[10px] font-bold uppercase tracking-tight px-2 h-5 border-none"
                    >
                        {titleCase(row.status)}
                    </Badge>
                );
            },
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 group text-xs text-muted-foreground hover:text-brand-primary"
                        onClick={() => router.replace(`/residency/${residencyId}/dues/${row.due_id}`)}
                    >

                        <Eye className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-2xl font-bold  text-foreground flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        My Dues
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and manage service charges, utility billings, and payment schedules for your unit.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-9 px-4 font-bold border-border/60 bg-muted/5 flex items-center">
                        Active Bills: {total}
                    </Badge>
                </div>
            </div>

            {/* Dues Ledger Table */}
            <div className="border p-3 border-border/60 rounded-lg overflow-hidden">

                <DataTable
                    data={dues}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search dues..."
                    showPagination={false}
                    currentPage={page}
                    onPageChange={setPage}
                    onPageSizeChange={(newPageSize) => {
                        setPage(1);
                        setPageSize(newPageSize);
                    }}
                    onSearchChange={(val) => {
                        setPage(1);
                        setSearch(val);
                    }}
                    initialSearch={search}
                    className="border-none"
                    initialSort={sort}
                    initialFilters={activeFilters}
                    availableFilters={availableFilters}
                    onFiltersChange={(filters) => {
                        const startDateVal = filters.find((f) => f.field === "created_at" && f.operator === "gte")?.value as string | undefined;
                        const endDateVal = filters.find((f) => f.field === "created_at" && f.operator === "lte")?.value as string | undefined;
                        const statusVal = filters.find(f => f.field === "status")?.value as string | undefined;
                        const paymentBreakdownVal = filters.find(f => f.field === "payment_breakdown")?.value as string | undefined;

                        if (startDateVal !== startDate) setStartDate(startDateVal || undefined);
                        if (endDateVal !== endDate) setEndDate(endDateVal || undefined);
                        if (statusVal !== status) setStatus(statusVal || undefined);
                        if (paymentBreakdownVal !== payment_breakdown) setPaymentBreakdown(paymentBreakdownVal || undefined);

                        setPage(1);
                    }}
                    onSortChange={(sort) => {
                        setPage(1)
                        setSort(sort)
                    }}
                    disableClientSideFiltering={true}
                    disableClientSideSorting={true}
                    isLoading={isLoading || isFetching}
                />
                <PaginationBar
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    totalPages={data?.total_pages ?? 1}
                    hasNext={
                        data?.has_next ??
                        page < (data?.total_pages ?? 0)
                    }
                    hasPrevious={
                        data?.has_previous ?? page > 1
                    }
                    isFetching={isFetching}
                    resourceLabel="dues"
                    onChange={(next) => setPage(next)}
                />

            </div>

            <div className="flex justify-between items-center text-[11px] text-muted-foreground/60 uppercase font-bold tracking-widest px-2">
                <span>VMS Core Property Ledger</span>
                <span>Entry Synchronization Active</span>
            </div>
        </div>
    );
}
