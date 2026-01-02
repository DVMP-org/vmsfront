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
const getStatusColor = (status: string) => {
    switch (status) {
        case "success":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
        case "failed":
            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
        case "pending":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
};

export default function WalletHistoryPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const { data: history, isLoading } = useWalletHistory(page, pageSize);

    const handleBack = useCallback(() => {
        router.push("/wallet");
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
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                ),
            statusBadge: (
                <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                </Badge>
            ),
        }));
    }, [history?.items]);

    // Memoize columns to avoid recreating on every render
    const columns: Column<TransactionRow>[] = useMemo(() => [
        {
            key: "typeIcon",
            header: "Type",
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    {row.typeIcon}
                    <span className="capitalize font-medium">{row.type}</span>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            sortable: true,
            accessor: (row) => (
                <span
                    className={`font-semibold ${row.type === "credit" ? "text-green-600" : "text-red-600"
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
                <span className="text-sm text-muted-foreground">
                    {row.description || "No description"}
                </span>
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
                <span className="text-sm">{formatDateTime(row.created_at)}</span>
            ),
        },
        {
            key: "reference",
            header: "Reference",
            accessor: (row) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {row.reference}
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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Wallet
                        </Button>
                        <h1 className="text-3xl font-bold">Wallet History</h1>
                        <p className="text-muted-foreground">
                            View all your wallet transactions
                        </p>
                    </div>
                </div>

                {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transactions</CardTitle>
                        <CardDescription>
                            {history?.total ? `${history.total} total transaction${history.total !== 1 ? "s" : ""}` : "No transactions"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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

