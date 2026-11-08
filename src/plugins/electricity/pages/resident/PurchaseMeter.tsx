"use client";

import { useEffect, useMemo, useState } from "react";
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
import { PageHeader } from "@/components/ui/PageHeader";
import { Field } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
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

    const meters = useMemo(() => metersData?.items ?? [], [metersData]);
    const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
    const [formData, setFormData] = useState({
        amount: 0,
    });
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const [purchaseResult, setPurchaseResult] = useState<{ token?: string; units?: number } | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    }, [meters, selectedMeter, selectedMeterId]);

    const handleMeterSelect = (meter: Meter) => {
        if (!meter || !meter.id) {
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
        const nextErrors: Record<string, string> = {};
        if (!selectedMeter) {
            nextErrors.meter = "Select a meter before purchasing electricity.";
        }

        if (!currentResidencyId) {
            nextErrors.residency = "Select a property relationship first.";
        }

        if (!userEmail) {
            nextErrors.account = "An account email is required.";
        }

        if (formData.amount <= 0) {
            nextErrors.amount = "Enter an amount greater than zero.";
        }
        setFormErrors(nextErrors);
        if (
            Object.keys(nextErrors).length > 0 ||
            !selectedMeter?.id ||
            !currentResidencyId ||
            !userEmail
        ) return;

        const purchaseData: PurchaseTokenCreate = {
            meter_id: selectedMeter.id,
            amount: formData.amount,
            residency_id: currentResidencyId,
            email: userEmail,
        };

        purchaseMutation.mutate(purchaseData);
    };

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

    if (isLoadingMeters) {
        return (
            <div className="space-y-5">
                <PageHeader
                    eyebrow="My workspace / Electricity"
                    title="Purchase electricity"
                    description="Loading available meters…"
                />
                <TableSkeleton rows={3} />
            </div>
        );
    }

    if (metersError) {
        return (
            <div className="space-y-5">
                <PageHeader
                    eyebrow="My workspace / Electricity"
                    title="Purchase electricity"
                />
                <EmptyState
                    icon={AlertCircle}
                    title="Meters could not be loaded"
                    description={parseApiError(metersQueryError).message}
                    action={{ label: "Retry", onClick: () => refetchMeters() }}
                />
            </div>
        );
    }

    if (purchaseSuccess && purchaseResult) {
        return (
            <div className="space-y-5 pb-8">
                <PageHeader
                    eyebrow="My workspace / Electricity"
                    title="Electricity purchase complete"
                    description="Your electricity token is ready for the selected meter."
                />
                <Card className="border-[color-mix(in_srgb,var(--vms-success)_32%,white)] bg-[var(--vms-success-subtle)]">
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center text-center">
                            <CheckCircle2 className="mb-4 h-12 w-12 text-[var(--vms-success)]" aria-hidden="true" />
                            <h2 className="mb-2 text-2xl font-semibold">Purchase successful</h2>
                            <p className="mb-4 text-sm text-[var(--vms-ink-muted)]">
                                Your electricity purchase has been processed successfully.
                            </p>
                            {purchaseResult.token && (
                                <div className="mb-6 w-full max-w-md rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-[var(--vms-ink-muted)]">Token</p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopyToken(purchaseResult.token!)}
                                            aria-label="Copy electricity token"
                                        >
                                            <Copy className="h-4 w-4" aria-hidden="true" />
                                            Copy
                                        </Button>
                                    </div>
                                    <p className="break-all text-center font-mono text-xl font-semibold">
                                        {cleanToken(purchaseResult.token)}
                                    </p>
                                </div>
                            )}
                            {purchaseResult.units !== undefined && (
                                <p className="mb-6 text-lg font-semibold">
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
            <PageHeader
                eyebrow="My workspace / Electricity"
                title="Purchase electricity"
                description="Select one of your meters and enter a purchase amount."
            />

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
                                    className={`min-h-11 w-full rounded-[var(--vms-radius-surface)] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2 ${selectedMeter?.id === meter.id
                                        ? "border-[var(--vms-action)] bg-[var(--vms-surface-subtle)]"
                                        : "border-[var(--vms-line)] hover:bg-[var(--vms-surface-subtle)]"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Zap className="h-5 w-5 text-[var(--vms-ink-muted)]" aria-hidden="true" />
                                                <span className="font-semibold">
                                                    {titleCase(meter.meter_number)}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                                                Type: {titleCase(meter.meter_type)} | DISCO: {titleCase(meter.disco.replace(/-/g, " "))}
                                            </p>
                                        </div>
                                        {selectedMeter?.id === meter.id && (
                                            <CheckCircle2 className="h-5 w-5 text-[var(--vms-action)]" aria-hidden="true" />
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
                                    <p className="text-xs text-[var(--vms-ink-muted)]">Available balance</p>
                                    <p className="text-sm font-semibold text-[var(--vms-action)]">
                                        {formatCurrency(wallet.balance)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormErrorSummary errors={formErrors} />
                        {selectedMeter ? (
                            <>
                                <Field id="purchase-amount" label="Amount (₦)" required error={formErrors.amount}>
                                  {({ id, ...control }) => (
                                    <Input
                                        id={id}
                                        {...control}
                                        type="number"
                                        placeholder="Enter amount"
                                        value={formData.amount || ""}
                                        onChange={(e) =>
                                            handleAmountChange(parseFloat(e.target.value) || 0)
                                        }
                                        min="0"
                                        step="0.01"
                                    />
                                  )}
                                </Field>

                                <div className="rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] p-4">
                                    <p className="mb-2 text-sm text-[var(--vms-ink-muted)]">
                                        Selected Meter: {selectedMeter.meter_number}
                                    </p>
                                    <p className="text-xs text-[var(--vms-ink-muted)]">
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
                                        <CreditCard className="h-4 w-4" aria-hidden="true" />
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
