"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Zap,
    Plus,
    CreditCard,
    Users,
    Activity,
    ArrowUpRight,
    TrendingUp,
    DollarSign
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// TODO: Replace with actual API calls when available
interface ElectricityStats {
    totalMeters: number;
    activeMeters: number;
    totalPurchases: number;
    totalRevenue: number;
    recentPurchases: Array<{
        id: string;
        meterNumber: string;
        residentName: string;
        amount: number;
        units: number;
        date: string;
        status: "success" | "pending" | "failed";
    }>;
}

// Mock data - replace with API call
const mockStats: ElectricityStats = {
    totalMeters: 0,
    activeMeters: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    recentPurchases: []
};

export default function AdminElectricityDashboard() {
    const [stats, setStats] = useState<ElectricityStats>(mockStats);
    const isLoading = false; // TODO: Replace with actual loading state from API

    // TODO: Replace with actual API call
    // const { data, isLoading } = useElectricityStats();

    const statCards = [
        {
            title: "Total Meters",
            value: stats.totalMeters,
            description: `${stats.activeMeters} active`,
            icon: Zap,
            accent: "from-blue-500 to-blue-600",
        },
        {
            title: "Total Purchases",
            value: stats.totalPurchases,
            description: "All time",
            icon: CreditCard,
            accent: "from-green-500 to-green-600",
        },
        {
            title: "Total Revenue",
            value: `₦${stats.totalRevenue.toLocaleString()}`,
            description: "All time",
            icon: DollarSign,
            accent: "from-purple-500 to-purple-600",
        },
        {
            title: "Active Residents",
            value: stats.recentPurchases.length,
            description: "With meters",
            icon: Users,
            accent: "from-orange-500 to-orange-600",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Electricity Management</h1>
                    <p className="text-muted-foreground">
                        Manage meters, purchases, and residents
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            // TODO: Navigate to add meter page
                            window.location.href = "/plugins/electricity/admin/meters";
                        }}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Meter
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card
                            key={card.title}
                            className={`overflow-hidden border-none bg-gradient-to-br ${card.accent}`}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-white/90">
                                    {card.title}
                                </CardTitle>
                                <span className="rounded-full bg-white/20 p-2 text-white shadow-sm">
                                    <Icon className="h-5 w-5" />
                                </span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white">
                                    {card.value}
                                </div>
                                <p className="text-sm text-white/80 mt-1">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Meters
                        </CardTitle>
                        <CardDescription>
                            Manage electricity meters
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                window.location.href = "/plugins/electricity/admin/meters";
                            }}
                        >
                            View All Meters
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Purchases
                        </CardTitle>
                        <CardDescription>
                            View all electricity purchases
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                window.location.href = "/plugins/electricity/admin/purchases";
                            }}
                        >
                            View All Purchases
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Residents
                        </CardTitle>
                        <CardDescription>
                            Manage residents and their meters
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                window.location.href = "/plugins/electricity/admin/residents";
                            }}
                        >
                            View Residents
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Purchases */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Purchases</CardTitle>
                    <CardDescription>
                        Latest electricity purchases
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.recentPurchases.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No purchases yet</p>
                            <p className="text-sm mt-2">
                                Purchases will appear here once residents start buying electricity
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentPurchases.map((purchase) => (
                                <div
                                    key={purchase.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">{purchase.residentName}</p>
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
                                            Meter: {purchase.meterNumber} • {purchase.units} units
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDate(purchase.date)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">₦{purchase.amount.toLocaleString()}</p>
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
