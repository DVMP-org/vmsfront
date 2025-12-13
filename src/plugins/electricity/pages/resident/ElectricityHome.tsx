"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Zap, CreditCard, ArrowUpRight, TrendingUp, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { electricityService } from "@/plugins/electricity/services/electricity-service";
import { Meter, PurchaseToken } from "@/plugins/electricity/types";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ResidentElectricityDashboard() {
    const router = useRouter();
    const { selectedHouse } = useAppStore();
    const { data: profile } = useProfile();

    // Get current house ID from selected house or first house from profile
    const currentHouseId = selectedHouse?.id || profile?.houses?.[0]?.id || null;

    // Fetch meters for the current house
    const { data: metersData, isLoading: isLoadingMeters } = useQuery({
        queryKey: ["electricity", "meters", currentHouseId],
        queryFn: async () => {
            if (!currentHouseId) throw new Error("House ID is required");
            const response = await electricityService.getMeters({
                page: 1,
                pageSize: 100,
                house_id: currentHouseId,
            });
            return response.data;
        },
        enabled: !!currentHouseId,
    });

    // Fetch recent purchases for the current house
    const { data: purchasesData, isLoading: isLoadingPurchases } = useQuery({
        queryKey: ["electricity", "purchases", currentHouseId],
        queryFn: async () => {
            if (!currentHouseId) throw new Error("House ID is required");
            const response = await electricityService.getPurchases({
                page: 1,
                pageSize: 10,
                house_id: currentHouseId,
            });
            return response.data;
        },
        enabled: !!currentHouseId,
    });

    const meters = metersData?.items || [];
    const recentPurchases = purchasesData?.items || [];
    const totalPurchases = purchasesData?.total || 0;

    const totalSpent = useMemo(() => {
        return recentPurchases
            .filter((p) => p.status === "success")
            .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
    }, [recentPurchases]);

    const isLoading = isLoadingMeters || isLoadingPurchases;

    // Show error if no house selected
    if (!currentHouseId) {
        return (
            <div className="space-y-6">
                <EmptyState
                    icon={Zap}
                    title="No house selected"
                    description="Please select a house from the dashboard to view electricity information"
                    action={{
                        label: "Go to Dashboard",
                        onClick: () => router.push("/select"),
                    }}
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        );
    }

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
                        router.push("/plugins/electricity/purchase");
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
                            {meters.length}
                        </div>
                        <p className="text-sm text-white/80 mt-1">
                            {meters.length} registered
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
                            {totalPurchases}
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
                            ₦{totalSpent.toLocaleString()}
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
                    {meters.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No meters registered</p>
                            <p className="text-sm mt-2">
                                Contact admin to register a meter for your house
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                                {meters.map((meter) => (
                                <Card key={meter.id} className="border">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Zap className="h-5 w-5 text-muted-foreground" />
                                                    <span className="font-semibold">
                                                            {meter.meter_number}
                                                        </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                        {meter.house?.name || meter.house?.address || "N/A"}
                                                </p>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {meter.meter_type}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {meter.disco}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-4"
                                            onClick={() => {
                                                router.push(`/plugins/electricity/purchase?meter=${meter.id}`);
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
                    {recentPurchases.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No purchases yet</p>
                            <p className="text-sm mt-2">
                                Start by purchasing electricity for your meter
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                                {recentPurchases.map((purchase) => (
                                <div
                                    key={purchase.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">
                                                    Meter: {purchase.meter?.meter_number || "N/A"}
                                            </p>
                                            <Badge
                                                variant={
                                                    purchase.status === "success"
                                                        ? "default"
                                                        : purchase.status === "pending"
                                                            ? "secondary"
                                                                : "warning"
                                                }
                                            >
                                                    {purchase.status || "pending"}
                                            </Badge>
                                        </div>
                                            {purchase.units !== undefined && (
                                                <p className="text-sm text-muted-foreground">
                                                    {purchase.units} units purchased
                                                </p>
                                            )}
                                            {purchase.token && (
                                                <p className="text-xs font-mono text-muted-foreground mt-1">
                                                    Token: {purchase.token}
                                                </p>
                                            )}
                                            {purchase.created_at && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(purchase.created_at)}
                                                </p>
                                            )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">
                                                ₦{parseFloat(purchase.amount || "0").toLocaleString()}
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
