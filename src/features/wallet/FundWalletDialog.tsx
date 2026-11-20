"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/form/Field";
import { formatMoney } from "@/features/place-workspace/ui";
import { cn } from "@/lib/utils";

import { useTopUpWallet } from "./queries";

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000];

/**
 * Starts a wallet top-up at the configured gateway.
 *
 * The redirect back to the app is not proof of payment: the wallet is credited
 * by the provider callback, so the dialog says so instead of claiming success.
 */
export function FundWalletDialog({
  placeId,
  open,
  onOpenChange,
}: {
  placeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState("5000");
  const topUp = useTopUpWallet(placeId);
  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric > 0;

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Fund wallet" size="sm">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              aria-pressed={amount === String(value)}
              className={cn(
                "min-h-9 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                amount === String(value)
                  ? "border-[var(--vms-ink)] bg-[var(--vms-ink)] text-[var(--vms-surface)]"
                  : "border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
              )}
            >
              {value.toLocaleString()}
            </button>
          ))}
        </div>

        <Field
          id="wallet-top-up-amount"
          label="Amount"
          required
          hint="You are sent to the payment gateway. Your wallet is credited only after the payment is verified."
        >
          {({ id, ...control }) => (
            <Input
              id={id}
              {...control}
              type="number"
              min={1}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          )}
        </Field>

        {!valid ? (
          <p className="text-xs text-[var(--vms-danger)]" role="alert">
            Enter an amount greater than zero.
          </p>
        ) : (
          <p className="text-xs text-[var(--vms-ink-muted)]">
            You will be charged {formatMoney(numeric)}. If you close the gateway
            page, the top-up stays pending until it is verified or expires.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            isLoading={topUp.isPending}
            disabled={!valid}
            onClick={() =>
              topUp.mutate(
                { amount },
                {
                  onSuccess: (response) => {
                    const payment = response.payment as {
                      authorization_url?: string;
                    } | null;
                    onOpenChange(false);
                    if (payment?.authorization_url) {
                      window.location.href = payment.authorization_url;
                    } else {
                      toast.message("Complete the payment to fund your wallet");
                    }
                  },
                },
              )
            }
          >
            Continue to payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
