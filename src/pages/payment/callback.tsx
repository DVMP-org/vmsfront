import { useEffect, useMemo, ReactElement } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function PaymentCallbackPage() {
    const router = useRouter();
    const { reference: queryRef, ref, tx_ref, transaction_id, flw_ref, transaction_reference, transactionReference, trxref, payment_reference, paymentReference, status: queryStatus, payment_status } = router.query;

    useEffect(() => {
        if (!router.isReady) return;

        const reference = queryRef || ref || tx_ref || transaction_id || flw_ref || transaction_reference || transactionReference || trxref || payment_reference || paymentReference;
        const status = queryStatus || payment_status;

        const params = new URLSearchParams();
        if (reference) params.set("reference", String(reference));
        if (status) params.set("status", String(status));

        router.replace(`/payment/success?${params.toString()}`);
    }, [router.isReady, router.query, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="p-8 text-center">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                    <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
                    <p className="text-sm text-muted-foreground">Redirecting...</p>
                </CardContent>
            </Card>
        </div>
    );
}
