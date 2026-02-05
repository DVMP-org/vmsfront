"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Zap, CreditCard, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-resident";
import { electricityService } from "@/plugins/electricity/services/electricity-service";
import { Meter, PurchaseTokenCreate } from "@/plugins/electricity/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { titleCase, formatCurrency } from "@/lib/utils";
import { parseApiError } from "@/lib/error-utils";
import { cleanToken } from "../../utils";

export default function ResidentPurchaseMeter() {
    const searchParams = useSearchParams() || new URLSearchParams();
    const router = useRouter();
    const selectedMeterId = searchParams.get("meter");
    const { selectedResidency } = useAppStore();
    const { data: user } = useProfile();
    const { data: wallet } = useWallet();

    // Get current residency ID from selected residency or first residency from profile
    const currentResidencyId = selectedResidency?.id || null;
    const userEmail = user?.email || "";

    const queryClient = useQueryClient();

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

    const meters = metersData?.items || [];
    const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
    const [formData, setFormData] = useState({
        amount: 0,
    });
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const [purchaseResult, setPurchaseResult] = useState<{ token?: string; units?: number } | null>(null);

    // Purchase mutation
    const purchaseMutation = useMutation({
        mutationFn: (data: PurchaseTokenCreate) => electricityService.purchaseToken(data),
        onSuccess: (response) => {
            toast.success("Electricity purchased successfully!");
            setPurchaseSuccess(true);
            setPurchaseResult({
                token: response.data.token,
                units: response.data.units,
            });
            queryClient.invalidateQueries({ queryKey: ["electricity", "meters", currentResidencyId] });
            queryClient.invalidateQueries({ queryKey: ["electricity", "purchases"] });
            setFormData({ amount: 0 });
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });

    useEffect(() => {
        if (selectedMeterId && meters.length > 0) {
            const meter = meters.find((m) => m.id === selectedMeterId);
            if (meter && meter.id) {
                setSelectedMeter(meter);
            }
        } else if (meters.length > 0 && !selectedMeter) {
            // Auto-select first meter if none is selected
            const firstMeter = meters[0];
            if (firstMeter && firstMeter.id) {
                setSelectedMeter(firstMeter);
            }
        }
    }, [selectedMeterId, meters]);

    const handleMeterSelect = (meter: Meter) => {
        console.log("Meter selected:", meter);
        if (!meter || !meter.id) {
            console.error("Invalid meter selected:", meter);
            toast.error("Invalid meter selected");
            return;
        }
        setSelectedMeter(meter);
    };

    const handleAmountChange = (amount: number) => {
        setFormData({ amount });
    };

    const handleCopyToken = (token: string) => {
        const cleanedToken = cleanToken(token);
        navigator.clipboard.writeText(cleanedToken);
        toast.success("Token copied to clipboard!");
    };



    const handlePurchase = async () => {
        if (!selectedMeter) {
            toast.error("Please select a meter");
            return;
        }

        if (!selectedMeter.id) {
            toast.error("Selected meter is invalid. Please select a valid meter.");
            console.error("Selected meter missing ID:", selectedMeter);
            return;
        }

        if (!currentResidencyId) {
            toast.error("Residency information is required. Please select a residency first.");
            return;
        }

        if (!userEmail) {
            toast.error("User email is required");
            return;
        }

        if (formData.amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        // Ensure we have a valid meter ID
        const meterId = selectedMeter.id;
        if (!meterId) {
            toast.error("Meter ID is missing. Please select a meter again.");
            console.error("Meter ID is missing from selected meter:", selectedMeter);
            return;
        }

        const purchaseData: PurchaseTokenCreate = {
            meter_id: meterId,
            amount: formData.amount,
            residency_id: currentResidencyId,
            email: userEmail,
        };

        console.log("Purchase data being sent:", purchaseData);
        purchaseMutation.mutate(purchaseData);
    };

    // Show loading state
    // if (isLoadingMeters) {
    //     return (
    //         <div className="space-y-6">
    //             <TableSkeleton />
    //         </div>
    //     );
    // }

    // Show error if no residency selected
    if (!currentResidencyId) {
        return (
            <div className="space-y-6">
                <EmptyState
                    icon={Zap}
                    title="No residency selected"
                    description="Please select a residency from the dashboard to purchase electricity"
                    action={{
                        label: "Go to Dashboard",
                        onClick: () => router.push("/select"),
                    }}
                />
            </div>
        );
    }

    if (purchaseSuccess && purchaseResult) {
        return (
            <div className="space-y-6">
                <Card className="border-green-200 bg-green-50 dark:bg-card">
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center text-center">
                            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Purchase Successful!</h2>
                            <p className="text-muted-foreground mb-4">
                                Your electricity purchase has been processed successfully.
                            </p>
                            {purchaseResult.token && (
                                <div
                                    className="w-full max-w-md p-4 bg-white dark:bg-gray-900 rounded-lg border mb-6 cursor-pointer hover:border-[rgb(var(--brand-primary))] transition-colors group"
                                    onClick={() => handleCopyToken(purchaseResult.token!)}
                                    title="Click to copy token"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-muted-foreground">Token</p>
                                        <Copy className="h-4 w-4 text-muted-foreground group-hover:text-[rgb(var(--brand-primary))]" />
                                    </div>
                                    <p className="text-xl font-mono font-bold text-center break-all">
                                        {cleanToken(purchaseResult.token)}
                                    </p>
                                </div>
                            )}
                            {purchaseResult.units !== undefined && (
                                <p className="text-lg font-semibold mb-6">
                                    Units: {purchaseResult.units} kWh
                                </p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPurchaseSuccess(false);
                                        setPurchaseResult(null);
                                        router.push("/plugins/electricity");
                                    }}
                                >
                                    Go to Dashboard
                                </Button>
                                <Button
                                    onClick={() => {
                                        setPurchaseSuccess(false);
                                        setPurchaseResult(null);
                                        setFormData({ amount: 0 });
                                    }}
                                >
                                    Make Another Purchase
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Purchase Electricity</h1>
                <p className="text-muted-foreground">
                    Buy electricity units for your meter
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Meter Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Meter</CardTitle>
                        <CardDescription>
                            Choose the meter you want to purchase electricity for
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {meters.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No meters available</p>
                                <p className="text-sm mt-2">
                                    Contact admin to register a meter for your residency
                                </p>
                            </div>
                        ) : (
                            meters.map((meter) => (
                                <button
                                    key={meter.id}
                                    onClick={() => handleMeterSelect(meter)}
                                    className={`w-full text-left p-4 border rounded-lg  ${selectedMeter?.id === meter.id
                                        ? "border-[var(--brand-primary)] bg-[rgb(var(--brand-primary)/0.2)]"
                                        : "hover:bg-accent"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Zap className="h-5 w-5 text-muted-foreground" />
                                                <span className="font-semibold">
                                                    {titleCase(meter.meter_number)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-muted-foreground mt-1">
                                                Type: {titleCase(meter.meter_type)} | DISCO: {titleCase(meter.disco.replace(/-/g, " "))}
                                            </p>
                                        </div>
                                        {selectedMeter?.id === meter.id && (
                                            <CheckCircle2 className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Purchase Form */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Purchase Details</CardTitle>
                                <CardDescription>
                                    Enter the amount you want to purchase
                                </CardDescription>
                            </div>
                            {wallet && (
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Available Balance</p>
                                    <p className="text-sm font-bold text-[rgb(var(--brand-primary))]">
                                        {formatCurrency(wallet.balance)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedMeter ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Amount (₦) *
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="Enter amount"
                                        value={formData.amount || ""}
                                        onChange={(e) =>
                                            handleAmountChange(parseFloat(e.target.value) || 0)
                                        }
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Selected Meter: {selectedMeter.meter_number}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Amount will be used to purchase electricity token for this meter
                                    </p>
                                </div>

                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={handlePurchase}
                                        disabled={!selectedMeter || formData.amount <= 0 || purchaseMutation.isPending}
                                        isLoading={purchaseMutation.isPending}
                                        className="w-full gap-2"
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        Purchase Electricity
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Please select a meter first</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
