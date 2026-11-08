"use client";

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
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { PluginMetricStrip, PluginNotice } from "@/components/plugins/PluginUi";
import { parseApiError } from "@/lib/error-utils";
import { cleanToken } from "../../utils";

export default function ResidentElectricityDashboard() {
    const router = useRouter();
    const { selectedResidency } = useAppStore();
    const { data: profile } = useProfile();

    // Get current residency ID from selected residency or first residency from profile
    const currentResidencyId = selectedResidency?.id || profile?.residencies?.[0]?.id || null;

    // Fetch meters for the current residency
    const { data: metersData, isLoading: isLoadingMeters, isError: metersError, error: metersQueryError, refetch: refetchMeters } = useQuery({
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
    const { data: purchasesData, isLoading: isLoadingPurchases, isError: purchasesError, error: purchasesQueryError, refetch: refetchPurchases } = useQuery({
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

    const totalSpent = recentPurchases.reduce(
        (sum, purchase) => sum + purchase.amount || 0,
        0,
    );

    const isLoading = isLoadingMeters || isLoadingPurchases;
    const isError = metersError || purchasesError;
    const queryError = metersQueryError || purchasesQueryError;
    const recentColumns: Column<PurchaseToken>[] = [
        {
            key: "meter",
            header: "Meter",
            accessor: (purchase) => purchase.meter?.meter_number || "—",
        },
        {
            key: "units",
            header: "Units",
            accessor: (purchase) =>
                purchase.units !== undefined ? `${purchase.units} units` : "—",
        },
        {
            key: "token",
            header: "Token",
            accessor: (purchase) =>
                purchase.token ? (
                    <span className="font-mono text-xs">{cleanToken(purchase.token)}</span>
                ) : (
                    "—"
                ),
        },
        {
            key: "amount",
            header: "Amount",
            accessor: (purchase) => (
                <span className="font-semibold tabular-nums">
                    ₦{purchase.amount.toLocaleString()}
                </span>
            ),
        },
        {
            key: "created_at",
            header: "Date",
            accessor: (purchase) =>
                purchase.created_at ? formatDate(purchase.created_at) : "—",
        },
    ];

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
        <div className="space-y-5 pb-8 text-[var(--vms-ink)]">
            <PageHeader
                eyebrow="My workspace / Electricity"
                title="Electricity"
                description="Review your meters, recent purchases, and available electricity actions."
                primaryAction={
                    <Button
                        onClick={() => {
                            router.push("/plugins/electricity/purchase");
                        }}
                    >
                        <CreditCard className="h-4 w-4" aria-hidden="true" />
                        Purchase electricity
                    </Button>
                }
            />

            {isError ? (
                <PluginNotice
                    tone="danger"
                    title="Electricity details could not be refreshed"
                    action={
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                refetchMeters();
                                refetchPurchases();
                            }}
                        >
                            Retry
                        </Button>
                    }
                >
                    {parseApiError(queryError).message}
                </PluginNotice>
            ) : null}

            <PluginMetricStrip
                label="Electricity summary"
                metrics={[
                    {
                        label: "My meters",
                        value: meters.length,
                        detail: "Registered to this relationship",
                        icon: Zap,
                    },
                    {
                        label: "Purchases",
                        value: totalPurchases,
                        detail: "All time",
                        icon: CreditCard,
                    },
                    {
                        label: "Recent spend",
                        value: `₦${totalSpent.toLocaleString()}`,
                        detail: "Latest purchases shown below",
                        icon: TrendingUp,
                    },
                ]}
            />

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
                        <EmptyState
                            icon={Activity}
                            title="No purchases yet"
                            description="Your electricity purchases and tokens will appear here."
                            action={{
                                label: "Purchase electricity",
                                onClick: () =>
                                    router.push("/plugins/electricity/purchase"),
                            }}
                        />
                    ) : (
                        <DataTable
                            data={recentPurchases}
                            columns={recentColumns}
                            searchable={false}
                            showPagination={false}
                            emptyMessage="No purchases found"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
