import { useState, useMemo, useCallback, ReactElement, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, Column, FilterConfig, FilterDefinition } from "@/components/ui/DataTable";
import { useWalletHistory } from "@/hooks/use-resident";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency, formatDateTime, getStatusStyles } from "@/lib/utils";
import { WalletTransaction } from "@/types";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { PaginationBar } from "@/components/ui/PaginationBar";


export default function WalletHistoryPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("");
    const [type, setType] = useState("");
    const [startDate, setStartDate] = useState<string | undefined>();
    const [endDate, setEndDate] = useState<string | undefined>();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);


    const activeFilters = useMemo(() => {
        const filters: FilterConfig[] = [];

        if (type) {
            filters.push({ field: "type", operator: "eq", value: type });
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
            type,
            startDate,
            endDate
        ]
    );

    const availableFilters: FilterDefinition[] = useMemo(() => {
        const filters: FilterDefinition[] = [

            {
                field: "created_at",
                label: "Created Between",
                type: "date-range",
            },
            {
                field: "type",
                label: "Type",
                type: "select",
                options: [
                    { value: "credit", label: "Credit" },
                    { value: "debit", label: "Debit" },
                ],
            },
        ]
        return filters;
    }, []);
    const { data: history, isLoading, isFetching } = useWalletHistory({
        page,
        pageSize,
        search: search.trim() || "",
        filters: activeFilters.length > 0 ? formatFiltersForAPI(activeFilters) : "",
        sort
    });

    const handleBack = useCallback(() => {
        router.push("/resident/wallet");
    }, [router]);

    type TransactionRow = WalletTransaction & {
        formattedAmount: string;
        typeIcon: React.ReactNode;
        statusBadge: React.ReactNode;
    };

    // Memoize transaction rows to avoid recreating on every render
    const transactionRows: TransactionRow[] = useMemo(() => {
        if (!history?.items) return [];

        return history.items.map((transaction) => ({
            ...transaction,
            formattedAmount: formatCurrency(Math.abs(transaction.amount)),
            typeIcon:
                transaction.type === "credit" ? (
                    <ArrowDownRight className="h-4 w-4 text-green-600" />
                ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-700" />
                ),
            statusBadge: (
                <Badge variant="outline" className={`text-[10px] px-1.5 uppercase font-bold
            ${getStatusStyles(transaction.status)}`}>
                    {transaction.status}
                </Badge>
            ),
        }));
    }, [history?.items]);

    // Memoize columns to avoid recreating on every render
    const columns: Column<TransactionRow>[] = useMemo(() => [
        {
            key: "type",
            header: "Type",
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-muted/50">
                        {row.typeIcon}
                    </div>
                    <span className="capitalize font-medium text-xs">{row.type}</span>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            sortable: true,
            accessor: (row) => (
                <span className={`font-semibold tabular-nums text-xs ${row.type === "credit" ? "text-green-600"
                    : "text-red-700"}`}>
                    {row.type === "credit" ? "+" : "-"}
                    {row.formattedAmount}
                </span>
            ),
        },
        {
            key: "description",
            header: "Description",
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="text-[13px] font-medium max-w-[300px] truncate">
                        {row.description || "No description"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                        {row.reference}
                    </span>
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            filterable: true,
            filterType: "select",
            filterOptions: [
                { value: "success", label: "Success" },
                { value: "pending", label: "Pending" },
                { value: "failed", label: "Failed" },
            ],
            accessor: (row) => row.statusBadge,
        },
        {
            key: "created_at",
            header: "Date",
            sortable: true,
            accessor: (row) => (
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDateTime(row.created_at)}
                </span>
            ),
        },
    ], []);


    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleBack}
                        className="h-8 w-8 rounded-full border">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Transaction History</h1>
                        <p className="text-xs text-muted-foreground">
                            Detailed view of all your wallet activities
                        </p>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <Card className="border-border/50 shadow-none">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-0.5">
                        <CardTitle className="text-sm font-semibold">Transactions</CardTitle>
                    </div>
                    <span
                        className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                        {history?.total || 0} Total
                    </span>
                </CardHeader>
                <CardContent className="p-0">

                    <>
                        <DataTable data={transactionRows} columns={columns} isLoading={isLoading || isFetching}
                            availableFilters={availableFilters} serverSide={true} searchable={true}
                            onFiltersChange={(filters) => {
                                const startDateVal = filters.find((f) => f.field === "created_at" && f.operator
                                    === "gte")?.value as string | undefined;
                                const endDateVal = filters.find((f) => f.field === "created_at" && f.operator
                                    === "lte")?.value as string | undefined;
                                const typeVal = filters.find((f) => f.field === "type" && f.operator
                                    === "eq")?.value as string | undefined;

                                if (startDateVal !== startDate) setStartDate(startDateVal || undefined);
                                if (endDateVal !== endDate) setEndDate(endDateVal || undefined);
                                if (typeVal !== type) setType(typeVal || "");

                                setPage(1);
                            }}
                            onSortChange={(newSort) => {
                                if (newSort !== sort) {
                                    setSort(newSort || "");
                                    setPage(1);
                                }
                            }}
                            onSearchChange={(val) => {
                                setSearchInput(val);
                            }}
                            initialFilters={activeFilters}
                            initialSort={sort}
                            initialSearch={searchInput}
                            emptyMessage="No transactions found"
                            searchPlaceholder="Search transactions..."
                            onPageChange={setPage}
                            showPagination={false}
                            disableClientSideFiltering={true}
                            disableClientSideSorting={true}
                        />

                        <PaginationBar page={page} pageSize={pageSize} total={history?.total ?? 0}
                            totalPages={history?.total_pages ?? 1} hasNext={history?.has_next ?? page <
                                (history?.total_pages ?? 0)} hasPrevious={history?.has_previous ?? page > 1
                                }
                            isFetching={isFetching}
                            resourceLabel="wallet history"
                            onChange={(next) => setPage(next)}
                        />
                    </>

                </CardContent>
            </Card>
        </div>
    );
}
WalletHistoryPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="resident">
                {page}
            </DashboardLayout>
        </RouteGuard>
    );
};
