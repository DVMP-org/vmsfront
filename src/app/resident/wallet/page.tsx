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
import { formatDateTime, titleCase, cn } from "@/lib/utils";
import { parseApiError } from "@/lib/error-utils";
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
    const { data: recentHistory, isLoading: isHistoryLoading } = useWalletHistory({ page: 1, pageSize: 5 });
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
        router.push("/resident/wallet/history");
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
            toast.error(parseApiError(error).message);
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
            <div className="max-w-5xl  space-y-8 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Wallet</h1>
                        <p className="text-muted-foreground font-medium">Manage your balance and transactions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-9 bg-background/50 hover:bg-background/80"
                            onClick={() => router.push("/resident/profile")}
                        >
                            Account Settings
                        </Button>
                        <Button
                            size="sm"
                            className="text-xs h-9 font-semibold shadow-sm"
                            onClick={() => setIsFundModalOpen(true)}
                        >
                            <CreditCard className="h-3.5 w-3.5 mr-2" />
                            Add Funds
                        </Button>
                    </div>
                </div>

                {/* Professional Enterprise Balance Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Balance Card - Clean & Professional */}
                    <Card className="lg:col-span-2 overflow-hidden border-border bg-card shadow-sm relative group transition-all duration-300 hover:shadow-md">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Wallet className="h-48 w-48 text-primary -rotate-12 translate-x-12 -translate-y-12" />
                        </div>

                        <CardContent className="p-8 relative z-10 flex flex-col justify-between min-h-[220px]">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "uppercase text-[10px] font-bold tracking-widest px-2.5 py-0.5 bg-background/50 backdrop-blur-sm",
                                                wallet?.status === "active" ? "text-green-600 border-green-200 bg-green-50/50" : "text-zinc-500"
                                            )}
                                        >
                                            {wallet?.status === 'active' ? 'Active Status' : wallet?.status || 'Unknown Status'}
                                        </Badge>
                                    </div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Available Balance</h3>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                                    <Wallet className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-8 space-y-6">
                                <div>
                                    <span className="text-5xl font-bold tracking-tighter text-foreground block">
                                        {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                                    <Button
                                        onClick={() => setIsFundModalOpen(true)}
                                        className="h-10 px-6 font-semibold shadow-sm transition-all"
                                    >
                                        <ArrowDownRight className="h-4 w-4 mr-2" />
                                        Fund Wallet
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-10 px-6 bg-background/50 hover:bg-background/80 font-medium"
                                        onClick={handleViewHistory}
                                    >
                                        Transaction History
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Column - Vertical Stack */}
                    <div className="space-y-4">
                        {/* Total In */}
                        <Card className="border-l-4 border-green-500 bg-card/50 shadow-sm hover:shadow transition-all">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Total Credits</p>
                                    <p className="text-xl font-bold text-foreground">
                                        {walletStats ? formatCurrency(walletStats.totalCredits) : "—"}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                                    <ArrowDownRight className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Out */}
                        <Card className="border-l-4 border-red-500 bg-card/50 shadow-sm hover:shadow transition-all">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Total Debits</p>
                                    <p className="text-xl font-bold text-foreground">
                                        {walletStats ? formatCurrency(walletStats.totalDebits) : "—"}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending */}
                        <Card className="border-l-4 border-amber-500 bg-card/50 shadow-sm hover:shadow transition-all">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Pending</p>
                                    <p className="text-xl font-bold text-foreground">
                                        {walletStats?.pendingCount || 0}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <History className="h-4 w-4" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleViewHistory} className="text-xs hover:bg-transparent hover:text-primary group">
                            View Full History
                            <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>

                    <Card className="border-border shadow-sm overflow-hidden bg-card/50">
                        <div className="divide-y divide-border/50">
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map((txn, idx) => (
                                    <div
                                        key={txn.id}
                                        className="group p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-default"
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center border shadow-sm flex-shrink-0",
                                            txn.type === 'credit'
                                                ? "bg-green-50 border-green-100 text-green-600 dark:bg-green-900/20 dark:border-green-800/50"
                                                : "bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800/50"
                                        )}>
                                            {txn.type === 'credit' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                        </div>

                                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="font-semibold text-sm truncate text-foreground">{txn.description || "Transaction"}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] uppercase px-1.5 py-0 h-5 font-bold border-0",
                                                        txn.status === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                            txn.status === 'pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    )}>
                                                        {txn.status}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {formatDateTime(txn.created_at)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end">
                                                <span className={cn(
                                                    "font-bold font-mono tracking-tight",
                                                    txn.type === 'credit' ? "text-green-600 dark:text-green-400" : "text-foreground"
                                                )}>
                                                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                    <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center border border-dashed border-muted-foreground/30">
                                        <History className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-muted-foreground">No transactions yet</h3>
                                        <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
                                            Your wallet activity will appear here once you start making transactions.
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setIsFundModalOpen(true)}>
                                        Fund Wallet
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Fund Wallet Modal */}
                <Modal
                    isOpen={isFundModalOpen}
                    title="Add Funds to Wallet"
                    onClose={() => {
                        if (!fundWalletMutation.isPending) {
                            setIsFundModalOpen(false);
                            setAmount("");
                            setDescription("");
                            setPaymentReference(null);
                        }
                    }}
                >
                    <div className="space-y-6 pt-2">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Payment Gateway</h4>
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
                                    size="lg"
                                    className="px-8 font-semibold"
                                >
                                    Proceed to Pay
                                </Button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}

