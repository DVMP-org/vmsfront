"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTransaction, useWalletTransaction } from "@/hooks/use-resident";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Wallet,
  Copy,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reference, setReference] = useState<string | null>(null);
  const [isInPopup, setIsInPopup] = useState(false);
  const [verificationTimeout, setVerificationTimeout] = useState(false);
  const [startTime] = useState(Date.now());

  // Extract reference from various possible query parameters
  // Different payment gateways use different parameter names
  useEffect(() => {
    // Flutterwave uses: tx_ref, transaction_id, flw_ref
    // PayStack uses: reference, trxref
    // Monify uses: transactionReference
    // Generic: reference, ref, payment_reference, etc.
    const ref =
      searchParams?.get("reference") ||
      searchParams?.get("ref") ||
      searchParams?.get("tx_ref") || // Flutterwave
      searchParams?.get("transaction_id") || // Flutterwave
      searchParams?.get("flw_ref") || // Flutterwave
      searchParams?.get("transaction_reference") ||
      searchParams?.get("transactionReference") ||
      searchParams?.get("trxref") || // PayStack
      searchParams?.get("payment_reference") ||
      searchParams?.get("paymentReference");

    if (ref) {
      setReference(ref);
    } else {
      // If no reference found, log available params for debugging
      const allParams = Array.from(searchParams?.entries() || [])
        .map(([key, value]) => `${key}=${value}`)
        .join(", ");
      console.warn(
        "Payment reference not found in URL. Available params:",
        allParams,
      );
      toast.error("Payment reference not found");
    }

    // Check if we're in a popup window
    setIsInPopup(window.opener !== null);
  }, [searchParams]);

  const { data: transaction, isLoading, error } = useTransaction(reference);

  // Set timeout for verification (wait 60 seconds before declaring failure)
  useEffect(() => {
    if (!reference) return;

    const timeout = setTimeout(() => {
      setVerificationTimeout(true);
    }, 60000); // 60 seconds

    return () => clearTimeout(timeout);
  }, [reference]);

  // Handle transaction status updates
  useEffect(() => {
    if (!transaction || !reference) return;

    // Invalidate wallet queries to refresh balance
    queryClient.invalidateQueries({ queryKey: ["resident", "wallet"] });
    queryClient.invalidateQueries({
      queryKey: ["resident", "wallet", "history"],
    });

    // If in popup, notify parent window
    if (isInPopup && window.opener) {
      if (transaction.status === "success") {
        window.opener.postMessage(
          {
            type: "PAYMENT_SUCCESS",
            reference: reference,
            transaction: transaction,
          },
          window.location.origin,
        );
      } else if (transaction.status === "failed") {
        window.opener.postMessage(
          {
            type: "PAYMENT_ERROR",
            reference: reference,
            message: "Payment failed",
          },
          window.location.origin,
        );
      }
    }

    // Auto-close popup after success (with delay for user to see message)
    if (isInPopup && transaction.status === "success") {
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }, [transaction, reference, isInPopup, queryClient]);

  const [copied, setCopied] = useState(false);

  const copyReference = () => {
    if (transaction?.reference) {
      navigator.clipboard.writeText(transaction.reference);
      setCopied(true);
      toast.success("Reference copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show loading state (including when we have error but haven't timed out yet)
  if (
    isLoading ||
    !reference ||
    ((error || !transaction) && !verificationTimeout)
  ) {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const remainingSeconds = Math.max(0, 60 - elapsedSeconds);

    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vms-canvas)] p-4">
        <Card className="w-full max-w-lg shadow-[var(--vms-shadow-overlay)]">
          <CardContent className="p-10 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-[var(--vms-surface-subtle)] animate-pulse motion-reduce:animate-none"></div>
              </div>
              <Loader2 className="relative mx-auto h-12 w-12 animate-spin text-[var(--vms-action)] motion-reduce:animate-none" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              Verifying Payment
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Please wait while we verify your payment...
            </p>
            {remainingSeconds > 0 && (
              <p className="text-xs text-muted-foreground mb-4">
                This may take up to {remainingSeconds} more{" "}
                {remainingSeconds === 1 ? "second" : "seconds"}
              </p>
            )}
            {reference && (
              <div className="mt-6 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Reference</p>
                <p className="text-xs font-mono text-foreground break-all">
                  {reference}
                </p>
              </div>
            )}
            {(error || !transaction) && !verificationTimeout && (
              <div className="mt-4 rounded-[var(--vms-radius-control)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-3">
                <p className="text-xs text-[var(--vms-warning)]">
                  Still verifying... Payment gateways may take time to process.
                  Please wait.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state only after timeout (60 seconds)
  if ((error || !transaction) && verificationTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vms-canvas)] p-4">
        <Card className="w-full max-w-lg border-[var(--vms-danger)] shadow-[var(--vms-shadow-overlay)]">
          <CardContent className="p-10 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-[var(--vms-danger-subtle)] animate-pulse motion-reduce:animate-none"></div>
              </div>
              <XCircle className="relative mx-auto h-16 w-16 text-[var(--vms-danger)]" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              Payment Verification Failed
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {error
                ? "Unable to verify payment. Please check your transaction history."
                : "Transaction not found after extended verification period."}
            </p>
            {reference && (
              <div className="mb-6 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Reference</p>
                <p className="text-xs font-mono text-foreground break-all">
                  {reference}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              {isInPopup ? (
                <Button onClick={() => window.close()}>Close</Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/resident/wallet")}
                  >
                    Go to Wallet
                  </Button>
                  <Button
                    onClick={() => router.push("/resident/wallet/history")}
                  >
                    View History
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state
  if (transaction?.status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vms-canvas)] p-4">
        <Card className="w-full max-w-lg overflow-hidden border-[var(--vms-success)] shadow-[var(--vms-shadow-overlay)]">
          <div className="bg-[var(--vms-success)] p-8 text-center text-white">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-white/20 animate-ping motion-reduce:animate-none"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-white/30"></div>
              </div>
              <CheckCircle2 className="relative mx-auto h-16 w-16" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-sm text-white/85">
              Your payment has been processed successfully
            </p>
          </div>

          <CardContent className="p-8">
            {/* Amount Highlight */}
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-2">Amount Paid</p>
              <p className="text-4xl font-bold tabular-nums text-[var(--vms-success)]">
                {formatCurrency(Math.abs(transaction.amount))}
              </p>
            </div>

            {/* Transaction Details */}
            <div className="bg-muted/50 rounded-lg border p-5 mb-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Transaction Reference
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-background px-2 py-1 rounded border">
                      {transaction.reference}
                    </span>
                    <button
                      onClick={copyReference}
                      className="p-1.5 hover:bg-muted rounded transition-colors"
                      title="Copy reference"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-[var(--vms-success)]" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {transaction.description && (
                  <div className="flex items-start justify-between pt-2 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Description
                    </span>
                    <span className="text-sm text-right max-w-[60%]">
                      {transaction.description}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Date & Time
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(transaction.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isInPopup ? (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  This window will close automatically in a few seconds...
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.close()}
                >
                  Close Now
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/wallet")}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Go to Wallet
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push("/wallet/history")}
                >
                  View History
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show pending state
  if (transaction?.status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vms-canvas)] p-4">
        <Card className="w-full max-w-lg border-[var(--vms-warning)] shadow-[var(--vms-shadow-overlay)]">
          <CardContent className="p-10 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-[var(--vms-warning-subtle)] animate-pulse motion-reduce:animate-none"></div>
              </div>
              <Loader2 className="relative mx-auto h-12 w-12 animate-spin text-[var(--vms-warning)] motion-reduce:animate-none" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              Payment Pending
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your payment is being processed. Please wait...
            </p>
            <div className="bg-muted/50 rounded-lg border p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--vms-warning)]" />
                  <span className="text-sm text-muted-foreground">
                    Reference
                  </span>
                </div>
                <span className="text-xs font-mono bg-background px-2 py-1 rounded border">
                  {transaction.reference}
                </span>
              </div>
            </div>
            {isInPopup ? (
              <p className="text-xs text-muted-foreground">
                We'll notify you when the payment is confirmed.
              </p>
            ) : (
              <Button variant="outline" onClick={() => router.push("/wallet")}>
                <Wallet className="h-4 w-4 mr-2" />
                Go to Wallet
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show failed state
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--vms-canvas)] p-4">
      <Card className="w-full max-w-lg overflow-hidden border-[var(--vms-danger)] shadow-[var(--vms-shadow-overlay)]">
        <div className="bg-[var(--vms-danger)] p-8 text-center text-white">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-white/20"></div>
            </div>
            <XCircle className="h-16 w-16 mx-auto relative" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
          <p className="text-sm text-white/85">
            Your payment could not be processed
          </p>
        </div>

        <CardContent className="p-8">
          <div className="text-center mb-6">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-white/85" />
            <p className="text-sm text-muted-foreground">
              Please check your payment details and try again
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg border p-5 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Transaction Reference
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-background px-2 py-1 rounded border">
                  {transaction?.reference}
                </span>
                <button
                  onClick={copyReference}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Copy reference"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-[var(--vms-success)]" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {transaction?.description && (
              <div className="flex items-start justify-between pt-3 border-t border-border/50">
                <span className="text-sm text-muted-foreground">
                  Description
                </span>
                <span className="text-sm text-right max-w-[60%]">
                  {transaction?.description}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {isInPopup ? (
              <Button className="flex-1" onClick={() => window.close()}>
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/wallet")}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Go to Wallet
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push("/wallet")}
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
