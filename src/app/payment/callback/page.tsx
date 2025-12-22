"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

/**
 * Payment callback page - handles redirects from payment gateways
 * and redirects to the success page with the reference parameter
 */
export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // Extract reference from various possible query parameters
        // Flutterwave uses: tx_ref, transaction_id, flw_ref
        // PayStack uses: reference, trxref
        // Monify uses: transactionReference
        const reference =
            searchParams.get("reference") ||
            searchParams.get("ref") ||
            searchParams.get("tx_ref") || // Flutterwave
            searchParams.get("transaction_id") || // Flutterwave
            searchParams.get("flw_ref") || // Flutterwave
            searchParams.get("transaction_reference") ||
            searchParams.get("transactionReference") ||
            searchParams.get("trxref") || // PayStack
            searchParams.get("payment_reference") ||
            searchParams.get("paymentReference");

        // Extract status if available
        const status = searchParams.get("status") || searchParams.get("payment_status");

        // Build redirect URL with all relevant parameters
        const params = new URLSearchParams();
        if (reference) {
            params.set("reference", reference);
        } else {
            // If no reference found, log available params for debugging
            const allParams = Array.from(searchParams.entries()).map(([key, value]) => `${key}=${value}`).join(", ");
            console.warn("Payment callback: reference not found. Available params:", allParams);
        }
        if (status) params.set("status", status);

        // Redirect to success page with parameters
        const redirectUrl = `/payment/success?${params.toString()}`;
        router.replace(redirectUrl);
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="p-8 text-center">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                    <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
                    <p className="text-sm text-muted-foreground">
                        Redirecting...
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

