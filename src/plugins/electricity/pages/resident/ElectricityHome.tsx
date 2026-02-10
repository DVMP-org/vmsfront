"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Zap, CreditCard, ArrowUpRight, TrendingUp, Activity } from "lucide-react";
import { formatDate, titleCase } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { electricityService } from "@/plugins/electricity/services/electricity-service";
import { Meter, PurchaseToken } from "@/plugins/electricity/types";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { cleanToken } from "../../utils";

export default function ResidentElectricityDashboard() {
    const router = useRouter();
    const { selectedResidency } = useAppStore();
    const { data: profile } = useProfile();

    // Get current residency ID from selected residency or first residency from profile
    const currentResidencyId = selectedResidency?.id || profile?.residencies?.[0]?.id || null;

    // Fetch meters for the current residency
    const { data: metersData, isLoading: isLoadingMeters } = useQuery({
        queryKey: ["electricity", "meters", currentResidencyId],
        queryFn: async () => {
            if (!currentResidencyId) throw new Error("Residency ID is required");
            const response = await electricityService.getMeters({
                page: 1,
                pageSize: 100,
                residency_id: currentResidencyId,
            });
            return response.data;
        },
        enabled: !!currentResidencyId,
    });

    // Fetch recent purchases for the current residency
    const { data: purchasesData, isLoading: isLoadingPurchases } = useQuery({
        queryKey: ["electricity", "purchases", currentResidencyId],
        queryFn: async () => {
            if (!currentResidencyId) throw new Error("Residency ID is required");
            const response = await electricityService.getPurchases({
                page: 1,
                pageSize: 10,
                residency_id: currentResidencyId,
            });
            return response.data;
        },
        enabled: !!currentResidencyId,
    });

    const meters = metersData?.items || [];
    const recentPurchases = purchasesData?.items || [];
    const totalPurchases = purchasesData?.total || 0;

    const totalSpent = useMemo(() => {
        return recentPurchases
            .reduce((sum, p) => sum + p.amount || 0, 0);
    }, [recentPurchases]);

    const isLoading = isLoadingMeters || isLoadingPurchases;

    // Show error if no residency selected
    if (!currentResidencyId) {
        return (
            <div className="space-y-6">
                <EmptyState
                    icon={Zap}
                    title="No residency selected"
                    description="Please select a residency from the dashboard to view electricity information"
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
                <Card className="border-none ">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted/90">
                            My Meters
                        </CardTitle>
                        <span className="rounded-full bg-white/20 p-2 text-muted-foreground shadow-sm">
                            <Zap className="h-5 w-5" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-muted-foreground">
                            {meters.length}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {meters.length} registered
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted/90">
                            Total Purchases
                        </CardTitle>
                        <span className="rounded-full bg-white/20 p-2 text-muted-foreground shadow-sm">
                            <CreditCard className="h-5 w-5" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-muted-foreground">
                            {totalPurchases}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card className="border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted/90">
                            Total Spent
                        </CardTitle>
                        <span className="rounded-full bg-white/20 p-2 text-muted-foreground shadow-sm">
                            <TrendingUp className="h-5 w-5" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-muted-foreground">
                            ₦{totalSpent.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">All time</p>
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
                                Contact admin to register a meter for your residency
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
                                                {/* <p className="text-sm text-muted-foreground">
                                                        {titleCase(meter.residency?.name ?? meter.residency?.address) || "N/A"}
                                                </p> */}
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {titleCase(meter.meter_type)}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {titleCase(meter.disco.replace(/-/g, " "))}
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Meter Number</TableHead>
                                    <TableHead>Units</TableHead>
                                    <TableHead>Token</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentPurchases.map((purchase) => (
                                    <TableRow key={purchase.id}>
                                        <TableCell className="font-medium">
                                            {purchase.meter?.meter_number || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {purchase.units !== undefined ? `${purchase.units} units` : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {purchase.token ? (
                                                <span className="font-mono text-xs">{cleanToken(purchase.token)}</span>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            ₦{purchase.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {purchase.created_at ? formatDate(purchase.created_at) : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
