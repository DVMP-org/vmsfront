import { useEffect, useMemo, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { useTransaction } from "@/hooks/use-resident";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Wallet, Copy, Check, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { reference: queryRef, ref, tx_ref, transaction_id, flw_ref, transaction_reference, transactionReference, trxref, payment_reference, paymentReference } = router.query;

    const [reference, setReference] = useState<string | null>(null);
    const [isInPopup, setIsInPopup] = useState(false);
    const [verificationTimeout, setVerificationTimeout] = useState(false);
    const [startTime] = useState(Date.now());

    useEffect(() => {
        if (!router.isReady) return;
        const r = queryRef || ref || tx_ref || transaction_id || flw_ref || transaction_reference || transactionReference || trxref || payment_reference || paymentReference;
        if (r) setReference(String(r));
        setIsInPopup(window.opener !== null);
    }, [router.isReady, router.query]);

    const { data: transaction, isLoading, error } = useTransaction(reference);

    useEffect(() => {
        if (!reference) return;
        const timeout = setTimeout(() => setVerificationTimeout(true), 60000);
        return () => clearTimeout(timeout);
    }, [reference]);

    useEffect(() => {
        if (!transaction || !reference) return;
        queryClient.invalidateQueries({ queryKey: ["resident", "wallet"] });
        queryClient.invalidateQueries({ queryKey: ["resident", "wallet", "history"] });

        if (isInPopup && window.opener) {
            const msg = transaction.status === "success" ? { type: "PAYMENT_SUCCESS", reference, transaction } : transaction.status === "failed" ? { type: "PAYMENT_ERROR", reference, message: "Payment failed" } : null;
            if (msg) window.opener.postMessage(msg, window.location.origin);
        }

        if (isInPopup && transaction.status === "success") {
            setTimeout(() => window.close(), 3000);
        }
    }, [transaction, reference, isInPopup, queryClient]);

    const [copied, setCopied] = useState(false);
    const copyReference = () => { if (transaction?.reference) { navigator.clipboard.writeText(transaction.reference); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); } };

    if (!router.isReady || (isLoading || !reference || ((error || !transaction) && !verificationTimeout))) {
        const remaining = Math.max(0, 60 - Math.floor((Date.now() - startTime) / 1000));
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-lg shadow-xl text-center p-10">
                    <Loader2 className="h-12 w-12 mx-auto mb-6 animate-spin text-primary" />
                    <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
                    <p className="text-sm text-muted-foreground mb-4">Please wait while we verify your payment... {remaining > 0 && `(Up to ${remaining}s remaining)`}</p>
                    {reference && <div className="p-3 bg-muted rounded-lg text-xs font-mono break-all">{reference}</div>}
                </Card>
            </div>
        );
    }

    if ((error || !transaction) && verificationTimeout) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-lg border-rose-200 text-center p-10">
                    <XCircle className="h-16 w-16 mx-auto mb-6 text-rose-500" />
                    <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                    <p className="text-sm text-muted-foreground mb-6">Unable to verify payment. Please check your transaction history.</p>
                    <div className="flex gap-3 justify-center">
                        {isInPopup ? <Button onClick={() => window.close()}>Close</Button> : <><Button variant="outline" onClick={() => router.push("/resident/wallet")}>Wallet</Button><Button onClick={() => router.push("/resident/wallet/history")}>History</Button></>}
                    </div>
                </Card>
            </div>
        );
    }

    if (transaction?.status === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-lg shadow-2xl overflow-hidden border-emerald-500/20">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center text-white">
                        <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
                        <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Paid!</h1>
                        <p className="text-white/80 text-sm">Your payment has been successfully processed.</p>
                    </div>
                    <CardContent className="p-8 space-y-6">
                        <div className="text-center">
                            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Amount Paid</p>
                            <p className="text-4xl font-black text-emerald-600">{formatCurrency(Math.abs(transaction.amount))}</p>
                        </div>
                        <div className="bg-muted/50 rounded-2xl border p-5 space-y-4">
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-muted-foreground uppercase">Reference</span><div className="flex items-center gap-2"><span className="text-xs font-mono">{transaction.reference}</span><button onClick={copyReference} className="p-1 hover:bg-muted rounded transition-colors">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</button></div></div>
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-muted-foreground uppercase">Date</span><span className="text-xs">{formatDateTime(transaction.created_at)}</span></div>
                        </div>
                        {isInPopup ? <p className="text-center text-[10px] text-muted-foreground uppercase font-bold">This window will auto-close...</p> : <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => router.push("/resident/wallet")}>Wallet</Button><Button className="flex-1" onClick={() => router.push("/resident/wallet/history")}>History</Button></div>}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg p-10 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500 animate-pulse" />
                <h2 className="text-2xl font-bold mb-2 uppercase tracking-tight">Processing...</h2>
                <p className="text-sm text-muted-foreground mb-6">Your payment is being confirmed. This might take a moment.</p>
                <Button variant="outline" onClick={() => router.push("/resident/wallet")}>Back to Wallet</Button>
            </Card>
        </div>
    );
}
