"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Zap, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// TODO: Replace with actual API types when available
interface Meter {
    id: string;
    meterNumber: string;
    houseAddress: string;
    status: "active" | "inactive";
    currentBalance?: number;
}

interface PurchaseForm {
    meterId: string;
    amount: number;
    units?: number;
}

// Mock data - replace with API call
const mockMeters: Meter[] = [];

export default function ResidentPurchaseMeter() {
    const searchParams = useSearchParams();
    const selectedMeterId = searchParams.get("meter");

    const [meters, setMeters] = useState<Meter[]>(mockMeters);
    const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
    const [formData, setFormData] = useState<PurchaseForm>({
        meterId: selectedMeterId || "",
        amount: 0,
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    // TODO: Replace with actual API calls
    // const { data: meters } = useResidentMeters();
    // const purchaseMutation = usePurchaseElectricity();

    useEffect(() => {
        if (selectedMeterId && meters.length > 0) {
            const meter = meters.find((m) => m.id === selectedMeterId);
            if (meter) {
                setSelectedMeter(meter);
                setFormData((prev) => ({ ...prev, meterId: meter.id }));
            }
        } else if (meters.length > 0 && !selectedMeter) {
            setSelectedMeter(meters[0]);
            setFormData((prev) => ({ ...prev, meterId: meters[0].id }));
        }
    }, [selectedMeterId, meters, selectedMeter]);

    const handleMeterSelect = (meter: Meter) => {
        setSelectedMeter(meter);
        setFormData((prev) => ({ ...prev, meterId: meter.id }));
    };

    const handleAmountChange = (amount: number) => {
        // TODO: Calculate units based on current rate (from API)
        // For now, using a mock calculation: 1 unit = ₦50
        const units = amount / 50;
        setFormData({
            ...formData,
            amount,
            units: Math.round(units * 100) / 100,
        });
    };

    const handlePurchase = async () => {
        if (!formData.meterId) {
            toast.error("Please select a meter");
            return;
        }

        if (formData.amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setIsProcessing(true);

        // TODO: Replace with actual API call
        // purchaseMutation.mutate(
        //     {
        //         meterId: formData.meterId,
        //         amount: formData.amount,
        //     },
        //     {
        //         onSuccess: () => {
        //             toast.success("Electricity purchased successfully!");
        //             setPurchaseSuccess(true);
        //             setFormData({ meterId: formData.meterId, amount: 0 });
        //         },
        //         onError: (error) => {
        //             toast.error(error.message || "Failed to purchase electricity");
        //         },
        //         onSettled: () => {
        //             setIsProcessing(false);
        //         },
        //     }
        // );

        // Mock success
        setTimeout(() => {
            toast.success("Electricity purchased successfully! (mock)");
            setPurchaseSuccess(true);
            setIsProcessing(false);
            setFormData({ meterId: formData.meterId, amount: 0 });
        }, 2000);
    };

    if (purchaseSuccess) {
        return (
            <div className="space-y-6">
                <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center text-center">
                            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Purchase Successful!</h2>
                            <p className="text-muted-foreground mb-6">
                                Your electricity purchase has been processed successfully.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPurchaseSuccess(false);
                                        window.location.href = "/plugins/electricity";
                                    }}
                                >
                                    Go to Dashboard
                                </Button>
                                <Button
                                    onClick={() => {
                                        setPurchaseSuccess(false);
                                        setFormData({ meterId: formData.meterId, amount: 0 });
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
                                    Contact admin to register a meter for your house
                                </p>
                            </div>
                        ) : (
                            meters.map((meter) => (
                                <button
                                    key={meter.id}
                                    onClick={() => handleMeterSelect(meter)}
                                    className={`w-full text-left p-4 border rounded-lg transition-colors ${selectedMeter?.id === meter.id
                                            ? "border-primary bg-primary/5"
                                            : "hover:bg-accent"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
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
                                            {meter.currentBalance !== undefined && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Current: {meter.currentBalance} kWh
                                                </p>
                                            )}
                                        </div>
                                        {selectedMeter?.id === meter.id && (
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
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
                        <CardTitle>Purchase Details</CardTitle>
                        <CardDescription>
                            Enter the amount you want to purchase
                        </CardDescription>
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

                                {formData.units && formData.amount > 0 && (
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">
                                                Units to receive:
                                            </span>
                                            <span className="text-lg font-semibold">
                                                {formData.units} kWh
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Rate: ₦50 per unit (mock rate)
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={handlePurchase}
                                        disabled={!formData.meterId || formData.amount <= 0 || isProcessing}
                                        className="w-full gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <AlertCircle className="h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="h-4 w-4" />
                                                Purchase Electricity
                                            </>
                                        )}
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
