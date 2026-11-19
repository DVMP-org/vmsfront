"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_CURRENCY, formatMoney, toAmount } from "@/lib/currency";
import { toDateInputValue } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import type { RecordBookingPaymentInput } from "../api-types";
import { useRecordBookingPayment } from "../queries";

const METHODS: Array<NonNullable<RecordBookingPaymentInput["method"]>> = [
    "cash",
    "transfer",
    "card",
    "other",
];

/**
 * Taking money that did not come through the gateway.
 *
 * A desk payment is not assumed to settle the bill: the amount starts at what is
 * outstanding because that is the common case, but it stays editable, and the
 * remaining balance is shown before anything is saved. The date is separate from
 * the moment of entry, because cash taken on Friday and keyed in on Monday was
 * still taken on Friday.
 *
 * Rendered both inside a drawer and standalone, so it holds no chrome of its own.
 */
export function RecordPaymentForm({
    bookingId,
    currency,
    balance,
    onDone,
    onCancel,
}: {
    bookingId: string;
    currency?: string;
    balance: string | null;
    onDone?: () => void;
    onCancel?: () => void;
}) {
    const record = useRecordBookingPayment(bookingId);
    const [amount, setAmount] = useState(balance ?? "");
    const [method, setMethod] =
        useState<NonNullable<RecordBookingPaymentInput["method"]>>("cash");
    const [reference, setReference] = useState("");
    const [paidOn, setPaidOn] = useState(toDateInputValue(new Date()));
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);

    const code = currency ?? DEFAULT_CURRENCY;
    const outstanding = toAmount(balance);
    const received = toAmount(amount);
    const remaining =
        outstanding !== null && received !== null ? outstanding - received : null;
    const valid = received !== null && received > 0;

    async function submit() {
        setError(null);
        try {
            await record.mutateAsync({
                amount: amount.trim(),
                currency: code,
                method,
                reference: reference.trim() || null,
                // A date input is a day. Noon local keeps it on the intended day for
                // everybody east or west of the server.
                paid_at: paidOn ? new Date(`${paidOn}T12:00:00`).toISOString() : null,
                note: note.trim() || null,
            });
            onDone?.();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "That payment could not be recorded.",
            );
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <dl className="flex flex-col gap-1 rounded-lg border border-[var(--vms-line)] px-3 py-2 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--vms-ink-muted)]">Outstanding</dt>
                    <dd className="tabular-nums">
                        {outstanding === null
                            ? "No price recorded"
                            : formatMoney(outstanding, code)}
                    </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--vms-ink-muted)]">
                        Remaining after payment
                    </dt>
                    <dd className="tabular-nums">
                        {remaining === null ? "—" : formatMoney(remaining, code)}
                    </dd>
                </div>
            </dl>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="record-payment-amount"
                    className="text-xs font-medium text-[var(--vms-ink)]"
                >
                    Amount received ({code})
                </label>
                <Input
                    id="record-payment-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    aria-invalid={!valid}
                />
                {!valid && amount.trim() ? (
                    <p className="text-xs text-[var(--vms-danger)]">
                        Enter an amount greater than zero.
                    </p>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="record-payment-method"
                        className="text-xs font-medium text-[var(--vms-ink)]"
                    >
                        Method
                    </label>
                    <select
                        id="record-payment-method"
                        value={method}
                        onChange={(event) =>
                            setMethod(
                                event.target
                                    .value as NonNullable<RecordBookingPaymentInput["method"]>,
                            )
                        }
                        className="min-h-11 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
                    >
                        {METHODS.map((choice) => (
                            <option key={choice} value={choice}>
                                {choice === "transfer"
                                    ? "Bank transfer"
                                    : choice === "card"
                                        ? "Card / POS"
                                        : humanize(choice)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="record-payment-date"
                        className="text-xs font-medium text-[var(--vms-ink)]"
                    >
                        Date received
                    </label>
                    <Input
                        id="record-payment-date"
                        type="date"
                        value={paidOn}
                        max={toDateInputValue(new Date())}
                        onChange={(event) => setPaidOn(event.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="record-payment-reference"
                    className="text-xs font-medium text-[var(--vms-ink)]"
                >
                    Reference <span className="font-normal">(optional)</span>
                </label>
                <Input
                    id="record-payment-reference"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="Receipt or transfer reference"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="record-payment-note"
                    className="text-xs font-medium text-[var(--vms-ink)]"
                >
                    Note <span className="font-normal">(optional)</span>
                </label>
                <Input
                    id="record-payment-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Balance on arrival"
                />
            </div>

            {error ? (
                <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
                    {error}
                </p>
            ) : null}

            <div className="flex items-center justify-end gap-2">
                {onCancel ? (
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                        Back
                    </Button>
                ) : null}
                <Button
                    type="button"
                    size="sm"
                    disabled={!valid || record.isPending}
                    isLoading={record.isPending}
                    onClick={() => void submit()}
                >
                    Record payment
                </Button>
            </div>
        </div>
    );
}
