"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PluginMetricStrip } from "@/components/plugins/PluginUi";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    Zap,
    Plus,
    CreditCard,
    ArrowUpRight,
    Users,
    DollarSign,
    AlertCircle,
} from "lucide-react";
import { formatDate, titleCase } from "@/lib/utils";
import { parseApiError } from "@/lib/error-utils";
import { electricityService } from "../../services/electricity-service";
import { ElectricityStats } from "../../types";

const defaultStats: ElectricityStats = {
    total_meters: 0,
    active_meters: 0,
    total_purchases: 0,
    total_revenue: 0,
    residencies: [],
    recent_purchases: []
};

export default function AdminElectricityDashboard() {
    const { data: statsResponse, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["electricity", "stats"],
        queryFn: async () => {
            const response = await electricityService.getStats();
            return response.data;
        },
    });

    const stats = statsResponse || defaultStats;

    if (isLoading) {
        return (
            <div className="space-y-5">
                <PageHeader
                    eyebrow="Extensions / Electricity"
                    title="Electricity management"
                    description="Loading meters and purchase activity…"
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[0, 1, 2, 3].map((item) => (
                        <Skeleton key={item} className="h-28 w-full" />
                    ))}
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const metrics = [
        {
            label: "Total meters",
            value: stats.total_meters,
            detail: `${stats.active_meters} active`,
            icon: Zap,
        },
        {
            label: "Total purchases",
            value: stats.total_purchases,
            detail: "All time",
            icon: CreditCard,
        },
        {
            label: "Total revenue",
            value: `₦${stats.total_revenue?.toLocaleString()}`,
            detail: "All time",
            icon: DollarSign,
        },
        {
            label: "Active property relationships",
            value: Array.from(
                new Set(
                    (stats.residencies || [])
                        .filter((residency) => Array.isArray(residency.meters) && residency.meters.length > 0)
                        .map((residency) => residency.id)
                        .filter(Boolean)
                )
            ).length,
            detail: "With meters",
            icon: Users,
        },
    ];


    return (
        <div className="space-y-5 pb-8 text-[var(--vms-ink)]">
            <PageHeader
                eyebrow="Extensions / Electricity"
                title="Electricity management"
                description="Monitor meters, purchases, and property relationships in this organization."
                primaryAction={
                    <Button
                        onClick={() => {
                            window.location.href = "/plugins/electricity/admin/meters";
                        }}
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add meter
                    </Button>
                }
            />

            {isError ? (
                <EmptyState
                    icon={AlertCircle}
                    title="Electricity summary unavailable"
                    description={parseApiError(error).message}
                    action={{ label: "Retry", onClick: () => refetch() }}
                />
            ) : (
                <PluginMetricStrip
                    label="Electricity summary"
                    metrics={metrics}
                />
            )}

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
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
                        <EmptyState
                            icon={CreditCard}
                            title="No purchases yet"
                            description="Purchases will appear here once occupants begin buying electricity."
                        />
                    ) : (
                        <div className="space-y-4">
                            {stats.recent_purchases.map((purchase) => (
                                <div
                                    key={purchase.id}
                                    className="flex items-center justify-between gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] p-4 transition-colors hover:bg-[var(--vms-surface-subtle)]"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">{purchase.residency_name}</p>
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
                                        <p className="text-sm text-[var(--vms-ink-muted)]">
                                            Meter: {purchase.meter_number} • {purchase.units} units
                                        </p>
                                        <p className="text-xs text-[var(--vms-ink-muted)] mt-1">
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
