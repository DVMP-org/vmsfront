"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useWallet, useFundWallet, useWalletTransaction, useWalletHistory } from "@/hooks/use-resident";
import { openPaymentPopup } from "@/lib/payment-popup";
import { Wallet, CreditCard, History, ArrowRight, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime, titleCase } from "@/lib/utils";
import { WalletTransaction } from "@/types";

// Memoized currency formatter to avoid recreating on every render
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
    }).format(value);
};

// Transaction item component (memoized for performance)
const TransactionItem = React.memo(({ transaction, onViewAll }: { transaction: WalletTransaction; onViewAll: () => void }) => {
    const isCredit = transaction.type === "credit";
    const Icon = isCredit ? ArrowDownRight : ArrowUpRight;
    const amountColor = isCredit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

    const statusConfig = useMemo(() => {
        switch (transaction.status) {
            case "success":
                return { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100", icon: CheckCircle2 };
            case "pending":
                return { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100", icon: Clock };
            case "failed":
                return { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100", icon: XCircle };
            default:
                return { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100", icon: Clock };
        }
    }, [transaction.status]);

    const StatusIcon = statusConfig.icon;

    return (
        <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm w-full"
        >
            <div className={`rounded-full p-2 ${isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <Icon className={`h-4 w-4 ${amountColor}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{transaction.description || "Transaction"}</p>
                    <span className={`font-semibold text-sm ${amountColor}`}>
                        {isCredit ? "+" : "-"}{formatCurrency(Math.abs(transaction.amount))}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusIcon className="h-3 w-3" />
                    <span className="capitalize">{transaction.status}</span>
                    <span>•</span>
                    <span>{formatDateTime(transaction.created_at)}</span>
                </div>
            </div>
        </button>
    );
});
TransactionItem.displayName = "TransactionItem";

export default function WalletPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: wallet, isLoading: isWalletLoading } = useWallet();
    const { data: recentHistory, isLoading: isHistoryLoading } = useWalletHistory(1, 5);
    const fundWalletMutation = useFundWallet();
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const { data: transaction } = useWalletTransaction(paymentReference);

    const isLoading = isWalletLoading || isHistoryLoading;

    // Memoized recent transactions
    const recentTransactions = useMemo(() => {
        return recentHistory?.items ?? [];
    }, [recentHistory?.items]);

    // Memoized wallet statistics
    const walletStats = useMemo(() => {
        if (!recentHistory?.items) return null;

        const transactions = recentHistory.items;
        const totalCredits = transactions
            .filter(t => t.type === "credit" && t.status === "success")
            .reduce((sum, t) => sum + t.amount, 0);
        const totalDebits = transactions
            .filter(t => t.type === "debit" && t.status === "success")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const pendingCount = transactions.filter(t => t.status === "pending").length;

        return { totalCredits, totalDebits, pendingCount };
    }, [recentHistory?.items]);

    // Watch transaction status when payment reference is set
    useEffect(() => {
        if (transaction && paymentReference) {
            if (transaction.status === "success") {
                toast.success("Payment successful! Wallet funded.");
                setIsFundModalOpen(false);
                setAmount("");
                setDescription("");
                setPaymentReference(null);
                queryClient.invalidateQueries({ queryKey: ["resident", "wallet"] });
                queryClient.invalidateQueries({ queryKey: ["resident", "wallet", "history"] });
            } else if (transaction.status === "failed") {
                toast.error("Payment failed. Please try again.");
                setPaymentReference(null);
            }
        }
    }, [transaction, paymentReference, queryClient]);

    const handleViewHistory = useCallback(() => {
        router.push("/wallet/history");
    }, [router]);

    const handleFundWallet = useCallback(async (e: React.FormEvent) => {
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
                        // The useWalletTransaction hook will handle polling
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
            toast.error(error.response?.data?.detail || "Failed to fund wallet");
        }
    }, [amount, description, fundWalletMutation]);

    if (isLoading) {
        return (
            <DashboardLayout type="resident">
                <div className="space-y-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="resident">
            <div className=" space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Wallet</h1>
                    <p className="text-muted-foreground">Manage your wallet balance and transactions</p>
                </div>

                {/* Balance Card */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Wallet className="h-5 w-5" />
                                    Wallet Balance
                                </CardTitle>
                                <CardDescription>Your current available balance</CardDescription>
                            </div>
                            {wallet && (
                                <Badge
                                    variant={wallet.status === "active" ? "secondary" : wallet.status === "frozen" ? "warning" : "default"}
                                    className={wallet.status === "closed" ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100" : ""}
                                >
                                    {titleCase(wallet.status.replace(/_/g, " "))}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-5xl font-bold tracking-tight">
                                {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => setIsFundModalOpen(true)} size="lg">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Fund Wallet
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleViewHistory}
                            >
                                <History className="h-4 w-4 mr-2" />
                                View History
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics Cards */}
                {walletStats && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Total Credits</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(walletStats.totalCredits)}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Total Debits</p>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            {formatCurrency(walletStats.totalDebits)}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Pending Transactions</p>
                                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                            {walletStats.pendingCount}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3">
                                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recent Transactions</CardTitle>
                                <CardDescription>Your latest wallet activity</CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleViewHistory}
                            >
                                View All
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentTransactions.length > 0 ? (
                            <div className="space-y-3">
                                {recentTransactions.map((txn) => (
                                    <TransactionItem
                                        key={txn.id}
                                        transaction={txn}
                                        onViewAll={handleViewHistory}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <p className="text-muted-foreground mb-4">No transactions yet</p>
                                <Button onClick={() => setIsFundModalOpen(true)}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Fund Wallet
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Fund Wallet Modal */}
                <Modal
                    isOpen={isFundModalOpen}
                    onClose={() => {
                        if (!fundWalletMutation.isPending) {
                            setIsFundModalOpen(false);
                            setAmount("");
                            setDescription("");
                            setPaymentReference(null);
                        }
                    }}
                    title="Fund Wallet"
                >
                    <form onSubmit={handleFundWallet} className="space-y-4">
                        <Input
                            type="number"
                            label="Amount"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            step="0.01"
                            required
                            disabled={fundWalletMutation.isPending || !!paymentReference}
                        />
                        <div>
                            <label className="block text-xs xs:text-sm font-medium text-foreground mb-1.5 xs:mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm xs:text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g., Wallet top-up for monthly expenses"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={fundWalletMutation.isPending || !!paymentReference}
                            />
                        </div>

                        {paymentReference && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    Payment window opened. Please complete the payment in the popup window.
                                </p>
                                {transaction?.status === "pending" && (
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                                        Waiting for payment confirmation...
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-4 justify-end pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsFundModalOpen(false);
                                    setAmount("");
                                    setDescription("");
                                    setPaymentReference(null);
                                }}
                                disabled={fundWalletMutation.isPending || !!paymentReference}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                isLoading={fundWalletMutation.isPending || !!paymentReference}
                                disabled={!!paymentReference}
                            >
                                Continue to Payment
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}

