"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Zap, CreditCard, ArrowUpRight, TrendingUp, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";

// TODO: Replace with actual API types when available
interface ResidentElectricityData {
    meters: Array<{
        id: string;
        meterNumber: string;
        houseAddress: string;
        status: "active" | "inactive";
        currentBalance?: number;
        lastPurchase?: string;
    }>;
    recentPurchases: Array<{
        id: string;
        meterNumber: string;
        amount: number;
        units: number;
        date: string;
        status: "success" | "pending" | "failed";
    }>;
    totalSpent: number;
    totalPurchases: number;
}

// Mock data - replace with API call
const mockData: ResidentElectricityData = {
    meters: [],
    recentPurchases: [],
    totalSpent: 0,
    totalPurchases: 0,
};

export default function ResidentElectricityDashboard() {
    const [data, setData] = useState<ResidentElectricityData>(mockData);
    const isLoading = false; // TODO: Replace with actual loading state from API

    // TODO: Replace with actual API call
    // const { data, isLoading } = useResidentElectricityData();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Electricity Management</h1>
                    <p className="text-muted-foreground">
                        Manage your electricity meters and purchases
                    </p>
                </div>
                <Button
                    onClick={() => {
                        window.location.href = "/plugins/electricity/purchase";
                    }}
                    className="gap-2"
                >
                    <CreditCard className="h-4 w-4" />
                    Purchase Electricity
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none bg-gradient-to-br from-blue-500 to-blue-600">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">
                            My Meters
                        </CardTitle>
                        <span className="rounded-full bg-white/20 p-2 text-white shadow-sm">
                            <Zap className="h-5 w-5" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">
                            {data.meters.length}
                        </div>
                        <p className="text-sm text-white/80 mt-1">
                            {data.meters.filter((m) => m.status === "active").length} active
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-green-500 to-green-600">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">
                            Total Purchases
                        </CardTitle>
                        <span className="rounded-full bg-white/20 p-2 text-white shadow-sm">
                            <CreditCard className="h-5 w-5" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">
                            {data.totalPurchases}
                        </div>
                        <p className="text-sm text-white/80 mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-purple-500 to-purple-600">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">
                            Total Spent
                        </CardTitle>
                        <span className="rounded-full bg-white/20 p-2 text-white shadow-sm">
                            <TrendingUp className="h-5 w-5" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">
                            ₦{data.totalSpent.toLocaleString()}
                        </div>
                        <p className="text-sm text-white/80 mt-1">All time</p>
                    </CardContent>
                </Card>
            </div>

            {/* My Meters */}
            <Card>
                <CardHeader>
                    <CardTitle>My Meters</CardTitle>
                    <CardDescription>
                        Your registered electricity meters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.meters.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No meters registered</p>
                            <p className="text-sm mt-2">
                                Contact admin to register a meter for your house
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {data.meters.map((meter) => (
                                <Card key={meter.id} className="border">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Zap className="h-5 w-5 text-muted-foreground" />
                                                    <span className="font-semibold">
                                                        {meter.meterNumber}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            meter.status === "active"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {meter.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {meter.houseAddress}
                                                </p>
                                            </div>
                                        </div>
                                        {meter.currentBalance !== undefined && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Current Balance
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {meter.currentBalance} kWh
                                                </p>
                                            </div>
                                        )}
                                        {meter.lastPurchase && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Last purchase: {formatDate(meter.lastPurchase)}
                                            </p>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-4"
                                            onClick={() => {
                                                window.location.href = `/plugins/electricity/purchase?meter=${meter.id}`;
                                            }}
                                        >
                                            Purchase Electricity
                                            <ArrowUpRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Purchases */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Purchases</CardTitle>
                    <CardDescription>
                        Your recent electricity purchases
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.recentPurchases.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No purchases yet</p>
                            <p className="text-sm mt-2">
                                Start by purchasing electricity for your meter
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.recentPurchases.map((purchase) => (
                                <div
                                    key={purchase.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">
                                                Meter: {purchase.meterNumber}
                                            </p>
                                            <Badge
                                                variant={
                                                    purchase.status === "success"
                                                        ? "default"
                                                        : purchase.status === "pending"
                                                            ? "secondary"
                                                            : "danger"
                                                }
                                            >
                                                {purchase.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {purchase.units} units purchased
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDate(purchase.date)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">
                                            ₦{purchase.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
