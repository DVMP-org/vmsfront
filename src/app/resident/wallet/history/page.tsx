"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column } from "@/components/ui/DataTable";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useWalletHistory } from "@/hooks/use-resident";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { WalletTransaction } from "@/types";

// Memoized currency formatter
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
    }).format(value);
};

// Memoized status color getter
const getStatusStyles = (status: string) => {
    switch (status) {
        case "success":
            return "border-green-500/50 text-green-600";
        case "failed":
            return "border-red-500/50 text-red-600";
        case "pending":
            return "border-amber-500/50 text-amber-600";
        default:
            return "border-border text-muted-foreground";
    }
};

export default function WalletHistoryPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const { data: history, isLoading } = useWalletHistory(page, pageSize);

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
                <Badge variant="outline" className={`text-[10px] px-1.5 uppercase font-bold ${getStatusStyles(transaction.status)}`}>
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
                <span
                    className={`font-semibold tabular-nums text-xs ${row.type === "credit" ? "text-green-600" : "text-red-700"
                        }`}
                >
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

    if (isLoading) {
        return (
            <DashboardLayout type="resident">
                <div className="space-y-6">
                    <CardSkeleton />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="resident">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className="h-8 w-8 rounded-full border"
                        >
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
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                            {history?.total || 0} Total
                        </span>
                    </CardHeader>
                    <CardContent className="p-0">
                        {history && history.items.length > 0 ? (
                            <>
                                <DataTable
                                    data={transactionRows}
                                    columns={columns}
                                    searchable={false}
                                />
                                {history.total_pages > 1 && (
                                    <div className="mt-6">
                                        <PaginationBar
                                            page={page}
                                            totalPages={history.total_pages}
                                            total={history.total}
                                            pageSize={history.page_size}
                                            onChange={setPage}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No transactions found</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => router.push("/wallet")}
                                >
                                    Fund Wallet
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

