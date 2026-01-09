"use client";

import { useQuery } from "@tanstack/react-query";
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
import { formatDate, titleCase } from "@/lib/utils";
import { electricityService } from "../../services/electricity-service";
import { ElectricityStats } from "../../types";

const defaultStats: ElectricityStats = {
    total_meters: 0,
    active_meters: 0,
    total_purchases: 0,
    total_revenue: 0,
    houses: [],
    recent_purchases: []
};

export default function AdminElectricityDashboard() {
    const { data: statsResponse, isLoading } = useQuery({
        queryKey: ["electricity", "stats"],
        queryFn: async () => {
            const response = await electricityService.getStats();
            return response.data;
        },
    });

    const stats = statsResponse || defaultStats;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Electricity Management</h1>
                        <p className="text-muted-foreground">
                            Manage meters, purchases, and residents
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Meters",
            value: stats.total_meters,
            description: `${stats.active_meters} active`,
            icon: Zap,
            accent: "text-red-500",
        },
        {
            title: "Total Purchases",
            value: stats.total_purchases,
            description: "All time",
            icon: CreditCard,
            accent: "text-primary",
        },
        {
            title: "Total Revenue",
            value: `₦${stats.total_revenue?.toLocaleString()}`,
            description: "All time",
            icon: DollarSign,
            accent: "text-blue-500",
        },
        {
            title: "Active Houses",
            value: Array.from(
                new Set(
                    (stats.houses || [])
                        .filter((house) => Array.isArray(house.meters) && house.meters.length > 0)
                        .map((house) => house.id)
                        .filter(Boolean)
                )
            ).length,
            description: "With meters",
            icon: Users,
            accent: "text-red-500",
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
                            className={`overflow-hidden border-none `}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium ">
                                    {card.title}
                                </CardTitle>
                                <span className="rounded-full bg-[rgb(var(--brand-primary)/0.2)] p-2 text-muted-foreground shadow-sm">
                                    <Icon className="h-5 w-5 p-3 rounded-full text-[rgb(var(--brand-primary))]" />
                                </span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {card.value}
                                </div>
                                <p className="text-sm mt-1">
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
                    {stats.recent_purchases.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No purchases yet</p>
                            <p className="text-sm mt-2">
                                Purchases will appear here once residents start buying electricity
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.recent_purchases.map((purchase) => (
                                <div
                                    key={purchase.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">{purchase.house_name}</p>
                                            <Badge
                                                variant={
                                                    purchase.status === "success"
                                                        ? "success"
                                                        : purchase.status === "pending"
                                                            ? "warning"
                                                            : "danger"
                                                }>
                                                {titleCase(purchase.status?.replace("_", " "))}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Meter: {purchase.meter_number} • {purchase.units} units
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
