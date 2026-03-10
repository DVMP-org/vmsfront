"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useFundWallet, useWalletTransaction } from "@/hooks/use-resident";
import { openPaymentPopup } from "@/lib/payment-popup";
import { parseApiError } from "@/lib/error-utils";

interface FundWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function FundWalletModal({ isOpen, onClose, onSuccess }: FundWalletModalProps) {
    const queryClient = useQueryClient();
    const fundWalletMutation = useFundWallet();
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const { data: transaction } = useWalletTransaction(paymentReference);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setAmount("");
            setDescription("");
            setPaymentReference(null);
        }
    }, [isOpen]);

    // Watch transaction status when payment reference is set
    useEffect(() => {
        if (transaction && paymentReference) {
            if (transaction.status === "success") {
                toast.success("Payment successful! Wallet funded.");
                setAmount("");
                setDescription("");
                setPaymentReference(null);
                queryClient.invalidateQueries({ queryKey: ["resident", "wallet"] });
                queryClient.invalidateQueries({ queryKey: ["resident", "wallet", "history"] });
                onSuccess?.();
                onClose();
            } else if (transaction.status === "failed") {
                toast.error("Payment failed. Please try again.");
                setPaymentReference(null);
            }
        }
    }, [transaction, paymentReference, queryClient, onClose, onSuccess]);

    const handleClose = useCallback(() => {
        if (!fundWalletMutation.isPending && !paymentReference) {
            setAmount("");
            setDescription("");
            setPaymentReference(null);
            onClose();
        }
    }, [fundWalletMutation.isPending, paymentReference, onClose]);

    const handleFundWallet = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            const amountNum = parseFloat(amount);
            if (!amount || isNaN(amountNum) || amountNum <= 0) {
                toast.error("Please enter a valid amount");
                return;
            }

            try {
                const response = await fundWalletMutation.mutateAsync({
                    amount: amountNum,
                    description: description.trim() || "Wallet funding",
                });

                if (response.data?.authorization_url && response.data?.reference) {
                    setPaymentReference(response.data.reference);

                    // Open payment popup
                    openPaymentPopup(
                        response.data.authorization_url,
                        response.data.reference,
                        (ref) => {
                            // Popup closed, start polling for transaction status
                            console.log("Payment popup closed, polling transaction:", ref);
                        },
                        (error) => {
                            toast.error(error || "Payment cancelled");
                            setPaymentReference(null);
                        }
                    );
                } else {
                    toast.error("Failed to initiate payment");
                }
            } catch (error: any) {
                toast.error(parseApiError(error).message);
            }
        },
        [amount, description, fundWalletMutation]
    );

    return (
        <Modal isOpen={isOpen} title="Add Funds to Wallet" onClose={handleClose}>
            <div className="space-y-6 pt-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                            Payment Gateway
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            You will be redirected to our secure payment processor to complete this transaction.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleFundWallet} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="number"
                            label="Amount to Fund"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            step="0.01"
                            required
                            className="font-mono text-lg"
                            disabled={fundWalletMutation.isPending || !!paymentReference}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g., Monthly utilities top-up"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={fundWalletMutation.isPending || !!paymentReference}
                        />
                    </div>

                    {paymentReference && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                    Awaiting Payment...
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                    Please complete the transaction in the popup window.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={fundWalletMutation.isPending || !!paymentReference}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={fundWalletMutation.isPending || !!paymentReference}
                            disabled={!!paymentReference}
                            size="lg"
                            className="px-8 font-semibold"
                        >
                            Proceed to Pay
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
