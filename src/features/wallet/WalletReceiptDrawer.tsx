"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

import type { WalletJournalEntry } from "./api";

const accountLabels: Record<string, string> = {
    party_liability: "Party wallet",
    funding_clearing: "Payment provider clearing",
    obligation_clearing: "Obligation settlement",
    fee_revenue: "Fee",
    refund_clearing: "Refund clearing",
};

const kindLabels: Record<string, string> = {
    funding: "Top-up",
    settlement: "Payment",
    refund: "Refund",
    adjustment: "Adjustment",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-[var(--vms-line)] py-2.5 last:border-b-0">
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                {label}
            </dt>
            <dd className="min-w-0 text-right text-sm text-[var(--vms-ink)]">
                {children}
            </dd>
        </div>
    );
}

/** The receipt for one posted journal: what moved, and why. */
export function WalletReceiptDrawer({
    entry,
    onClose,
}: {
    entry: WalletJournalEntry | null;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const lines = useMemo(() => entry?.lines ?? [], [entry]);
    const totals = useMemo(() => {
        const debit = lines
            .filter((line) => line.direction === "debit")
            .reduce((sum, line) => sum + line.amount_minor, 0);
        const credit = lines
            .filter((line) => line.direction === "credit")
            .reduce((sum, line) => sum + line.amount_minor, 0);
        return { debit, credit, balanced: debit === credit && debit > 0 };
    }, [lines]);

    const copyReference = async () => {
        if (!entry) return;
        try {
            await navigator.clipboard.writeText(entry.reference);
            setCopied(true);
            toast.success("Reference copied");
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy on this device");
        }
    };

    return (
        <Drawer
            isOpen={Boolean(entry)}
            onClose={onClose}
            title="Wallet receipt"
            description="A posted journal. Entries are never edited; corrections are new journals."
            icon={ReceiptText}
            eyebrow={entry ? kindLabels[entry.kind] ?? entry.kind : undefined}
            footer={
                <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            }
        >
            {entry ? (
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-2xl font-semibold tabular-nums">
                                {entry.direction === "credit" ? "+" : "−"}
                                {formatMoney(Number(entry.amount))}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                                {entry.direction === "credit"
                                    ? "Credited to your wallet"
                                    : "Settled from your wallet"}
                            </p>
                        </div>
                        <Badge variant={entry.direction === "credit" ? "success" : "neutral"}>
                            {kindLabels[entry.kind] ?? entry.kind}
                        </Badge>
                    </div>

                    <dl>
                        <Row label="Reference">
                            <span className="inline-flex items-center gap-2">
                                <span className="font-mono text-xs">{entry.reference}</span>
                                <button
                                    type="button"
                                    onClick={copyReference}
                                    aria-label="Copy reference"
                                    className="grid h-7 w-7 place-items-center rounded-md text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                                >
                                    {copied ? (
                                        <Check aria-hidden className="h-3.5 w-3.5" />
                                    ) : (
                                        <Copy aria-hidden className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </span>
                        </Row>
                        <Row label="Posted">{formatDate(entry.created_at)}</Row>
                        <Row label="Module">{entry.source_module ?? "Core"}</Row>
                        {entry.source_reference ? (
                            <Row label="Reference to source">
                                <span className="font-mono text-xs">
                                    {entry.source_reference}
                                </span>
                            </Row>
                        ) : null}
                        {entry.description ? (
                            <Row label="Description">{entry.description}</Row>
                        ) : null}
                    </dl>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Ledger lines</h3>
                            {lines.length ? (
                                <Badge variant={totals.balanced ? "success" : "danger"}>
                                    {totals.balanced ? "Balanced" : "Unbalanced"}
                                </Badge>
                            ) : null}
                        </div>
                        {lines.length ? (
                            <div className="overflow-hidden rounded-lg border border-[var(--vms-line)]">
                                <table className="w-full text-sm">
                                    <thead className="bg-[var(--vms-surface-subtle)] text-left text-xs text-[var(--vms-ink-muted)]">
                                        <tr>
                                            <th className="px-3 py-2 font-semibold">Account</th>
                                            <th className="px-3 py-2 text-right font-semibold">Debit</th>
                                            <th className="px-3 py-2 text-right font-semibold">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((line, index) => (
                                            <tr
                                                key={`${line.account}-${line.direction}-${index}`}
                                                className="border-t border-[var(--vms-line)]"
                                            >
                                                <td className="px-3 py-2">
                                                    {accountLabels[line.account] ?? line.account}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {line.direction === "debit"
                                                        ? formatMoney(Number(line.amount))
                                                        : "—"}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {line.direction === "credit"
                                                        ? formatMoney(Number(line.amount))
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t border-[var(--vms-line-strong)] bg-[var(--vms-surface-subtle)] text-xs font-semibold">
                                        <tr>
                                            <td className="px-3 py-2">Total</td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {formatMoney(totals.debit / 100)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {formatMoney(totals.credit / 100)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                Ledger detail is not available for this journal.
                            </p>
                        )}
                    </div>
                </div>
            ) : null}
        </Drawer>
    );
}
