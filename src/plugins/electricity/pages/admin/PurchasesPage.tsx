"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DataTable, Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { CreditCard, Search, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/utils";

// TODO: Replace with actual API types when available
interface Purchase {
    id: string;
    meterNumber: string;
    residentName: string;
    houseAddress: string;
    amount: number;
    units: number;
    status: "success" | "pending" | "failed";
    transactionId: string;
    createdAt: string;
}

// Mock data - replace with API call
const mockPurchases: Purchase[] = [];

export default function AdminPurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // TODO: Replace with actual API call
    // const { data: purchases, isLoading } = useElectricityPurchases();

    const filteredPurchases = purchases.filter(
        (purchase) =>
            purchase.meterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            purchase.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            purchase.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalRevenue = purchases
        .filter((p) => p.status === "success")
        .reduce((sum, p) => sum + p.amount, 0);

    const columns: Column<Purchase>[] = [
        {
            key: "transactionId",
            header: "Transaction ID",
            accessor: (purchase) => (
                <span className="font-mono text-sm">{purchase.transactionId}</span>
            ),
        },
        {
            key: "meterNumber",
            header: "Meter",
            accessor: (purchase) => purchase.meterNumber,
        },
        {
            key: "residentName",
            header: "Resident",
            accessor: (purchase) => purchase.residentName,
        },
        {
            key: "houseAddress",
            header: "House",
            accessor: (purchase) => (
                <span className="text-muted-foreground">{purchase.houseAddress}</span>
            ),
        },
        {
            key: "units",
            header: "Units",
            accessor: (purchase) => (
                <span className="font-medium">{purchase.units} kWh</span>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            accessor: (purchase) => (
                <span className="font-semibold">₦{purchase.amount.toLocaleString()}</span>
            ),
        },
        {
            key: "status",
            header: "Status",
            accessor: (purchase) => (
                <Badge
                    variant={
                        purchase.status === "success"
                            ? "success"
                            : purchase.status === "pending"
                                ? "secondary"
                                : "warning"
                    }
                >
                    {purchase.status}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Date",
            accessor: (purchase) => formatDate(purchase.createdAt),
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
                    <Card className="border-none bg-gradient-to-br from-green-500 to-green-600">
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
                                onChange={(e) => setSearchQuery(e.target.value)}
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
                        <DataTable
                            data={filteredPurchases}
                            columns={columns}
                            searchable={false}
                            emptyMessage="No purchases found"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

