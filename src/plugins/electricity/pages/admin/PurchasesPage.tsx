"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DataTable, Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Badge } from "@/components/ui/Badge";
import { CreditCard, Search, DollarSign } from "lucide-react";
import { formatDate, titleCase } from "@/lib/utils";
import { electricityService } from "@/plugins/electricity/services/electricity-service";
import { PurchaseToken } from "@/plugins/electricity/types";
import { useQuery } from "@tanstack/react-query";

export default function AdminPurchasesPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch purchases
    const { data: purchasesData, isLoading, isFetching } = useQuery({
        queryKey: ["electricity", "purchases", page],
        queryFn: async () => {
            const response = await electricityService.getPurchases({
                page,
                pageSize,
            });
            return response.data;
        },
    });

    const purchases = purchasesData?.items || [];

    // Filter purchases by search query (client-side filtering for now)
    const filteredPurchases = purchases.filter(
        (purchase) =>
            purchase.meter?.meter_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            purchase.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            purchase.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalRevenue = purchases
        .filter((p) => p.transaction?.status === "success")
        .reduce((sum, p) => sum + p.amount, 0);

    // Pagination data
    const totalPages = purchasesData?.total_pages ?? 1;
    const total = purchasesData?.total ?? 0;
    const hasNext = purchasesData?.has_next ?? false;
    const hasPrevious = purchasesData?.has_previous ?? false;
    const showPagination = totalPages > 1;

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const columns: Column<PurchaseToken>[] = [
        {
            key: "transaction_reference",
            header: "Reference",
            accessor: (purchase) => (
                <span className="font-mono text-sm">{purchase.transaction?.reference || "N/A"}</span>
            ),
        },
        {
            key: "meter",
            header: "Meter",
            accessor: (purchase) => purchase.meter?.meter_number || "N/A",
        },
        {
            key: "email",
            header: "Email",
            accessor: (purchase) => purchase.email,
        },
        {
            key: "house",
            header: "House",
            accessor: (purchase) => (
                <span className="text-muted-foreground">
                    {purchase?.house?.name || "N/A"}
                </span>
            ),
        },
        {
            key: "units",
            header: "Units",
            accessor: (purchase) => (
                <span className="font-medium">
                    {purchase.units ? `${purchase.units} kWh` : "N/A"}
                </span>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            accessor: (purchase) => (
                <span className="font-semibold">
                    ₦{purchase.amount.toLocaleString()}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            accessor: (purchase) => (
                <Badge
                    variant={
                        purchase.transaction?.status === "success"
                            ? "success"
                            : purchase.transaction?.status === "pending"
                                ? "warning"
                                : "danger"
                    }
                >
                    {titleCase(purchase.transaction?.status || "pending").replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "created_at",
            header: "Date",
            accessor: (purchase) => purchase.created_at ? formatDate(purchase.created_at) : "N/A",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Electricity Purchases</h1>
                    <p className="text-muted-foreground">
                        View all electricity purchase transactions
                    </p>
                </div>
                {totalRevenue > 0 && (
                    <Card className="rounded-3xl bg-gradient-to-br from-[var(--brand-primary,#213928)] to-[var(--brand-secondary,#64748b)] text-white shadow-xl">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-white">
                                <DollarSign className="h-5 w-5" />
                                <div>
                                    <p className="text-xs text-white/80">Total Revenue</p>
                                    <p className="text-2xl font-bold">
                                        ₦{totalRevenue.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Purchases Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>All Purchases</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search purchases..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1); // Reset to first page on search
                                }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TableSkeleton />
                    ) : filteredPurchases.length === 0 ? (
                        <EmptyState
                            icon={CreditCard}
                            title="No purchases yet"
                            description={
                                searchQuery
                                    ? "No purchases match your search"
                                    : "Purchases will appear here once residents start buying electricity"
                            }
                        />
                    ) : (
                                <>
                                    <DataTable
                                        data={filteredPurchases}
                                        columns={columns}
                                        searchable={false}
                                        showPagination={false}
                                        emptyMessage="No purchases found"
                                    />
                                    {showPagination && (
                                        <PaginationBar
                                            page={page}
                                            pageSize={pageSize}
                                            total={total}
                                            totalPages={totalPages}
                                            hasNext={hasNext}
                                            hasPrevious={hasPrevious}
                                            resourceLabel="purchases"
                                            onChange={handlePageChange}
                                            isFetching={isFetching}
                                            className="mt-6"
                                        />
                                    )}
                                </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

