"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Lock, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/currency";
import {
    EmptyRow,
    IconTile,
    SectionCard,
    surfaceClass,
} from "@/features/place-workspace/ui";
import { cn } from "@/lib/utils";

import { FundWalletDialog } from "./FundWalletDialog";
import { useWallet } from "./queries";

function asOf(value?: string | null) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });
}

function Stat({
    label,
    value,
    hint,
    tone,
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: "muted" | "strong";
}) {
    return (
        <div className="min-w-[7.5rem] flex-1 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                {label}
            </p>
            <p
                className={cn(
                    "mt-1 text-sm font-semibold tabular-nums",
                    tone === "muted"
                        ? "text-[var(--vms-ink-muted)]"
                        : "text-[var(--vms-ink)]",
                )}
            >
                {value}
            </p>
            {hint ? (
                <p className="mt-0.5 text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

/**
 * The Party's wallet balance. This is core functionality, not part of any
 * plugin: electricity, charges and any other module render the same card.
 *
 * `compact` is the inline variant used inside a module page; `full` is the
 * workspace hero. Both read the same server-derived figures — nothing here
 * computes a balance.
 */
export function WalletSummaryCard({
    placeId,
    showFundAction = true,
    variant = "compact",
    className,
}: {
    placeId: string;
    showFundAction?: boolean;
    variant?: "compact" | "full";
    className?: string;
}) {
    const walletQuery = useWallet(placeId);
    const [fundOpen, setFundOpen] = useState(false);
    const wallet = walletQuery.data;
    const frozen = wallet?.status === "frozen";
    const closed = wallet?.status === "closed";
    const canFund = Boolean(wallet) && !frozen && !closed;

    const dialog = showFundAction ? (
        <FundWalletDialog
            placeId={placeId}
            open={fundOpen}
            onOpenChange={setFundOpen}
        />
    ) : null;

    if (!wallet) {
        return (
            <SectionCard
                title="Wallet"
                description="Your wallet balance in this organization."
                className={className}
            >
                {walletQuery.isLoading ? (
                    <div className="space-y-2" role="status" aria-label="Loading wallet">
                        <div className="h-8 w-40 animate-pulse rounded-md bg-[var(--vms-surface-subtle)]" />
                        <div className="h-3 w-56 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
                    </div>
                ) : walletQuery.isError ? (
                    <EmptyRow
                        icon={Wallet}
                        title="Wallet unavailable"
                        description="Your wallet could not be loaded. Try again in a moment."
                        action={
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => walletQuery.refetch()}
                            >
                                Retry
                            </Button>
                        }
                    />
                ) : (
                    <EmptyRow
                        icon={Wallet}
                        title="No wallet yet"
                        description="A wallet is created the first time you need one."
                    />
                )}
            </SectionCard>
        );
    }

    const available = Number(wallet.available);
    const timestamp = asOf(wallet.as_of);

    if (variant === "compact") {
        return (
            <SectionCard
                title="Wallet"
                description="Your wallet pays for electricity and other bills in this organization."
                className={className}
                action={
                    showFundAction ? (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!canFund}
                            onClick={() => setFundOpen(true)}
                        >
                            {frozen ? "Wallet frozen" : "Fund wallet"}
                        </Button>
                    ) : undefined
                }
            >
                <div className="flex items-center gap-3">
                    <IconTile icon={Wallet} tone={frozen ? "warning" : "coral"} />
                    <div className="min-w-0">
                        <p className="text-lg font-semibold tabular-nums">
                            {formatMoney(available)} available
                        </p>
                        <p className="text-xs text-[var(--vms-ink-muted)]">
                            {formatMoney(Number(wallet.held))} held ·{" "}
                            {formatMoney(Number(wallet.posted))} posted · {wallet.currency}
                        </p>
                    </div>
                </div>
                {dialog}
            </SectionCard>
        );
    }

    return (
        <section
            className={cn(surfaceClass, "overflow-hidden", className)}
            aria-labelledby="wallet-balance-heading"
        >
            <div className="flex flex-col gap-5 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--vms-ink-muted)]">
                            Available to spend
                        </p>
                        <h2
                            id="wallet-balance-heading"
                            className="mt-1 flex flex-wrap items-baseline gap-2 text-[32px] font-semibold leading-none tracking-[-0.03em] text-[var(--vms-ink)] tabular-nums sm:text-[38px]"
                        >
                            {formatMoney(available)}
                            <span className="text-sm font-semibold tracking-normal text-[var(--vms-ink-muted)]">
                                {wallet.currency}
                            </span>
                        </h2>
                        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--vms-ink-muted)]">
                            <span>
                                Posted {formatMoney(Number(wallet.posted))} · held{" "}
                                {formatMoney(Number(wallet.held))}
                            </span>
                            {timestamp ? (
                                <>
                                    <span aria-hidden>·</span>
                                    <span>as of {timestamp}</span>
                                </>
                            ) : null}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {frozen ? (
                            <Badge variant="warning">
                                <Lock aria-hidden className="h-3 w-3" /> Frozen
                            </Badge>
                        ) : closed ? (
                            <Badge variant="danger">Closed</Badge>
                        ) : (
                            <Badge variant="success">Active</Badge>
                        )}
                        {showFundAction ? (
                            <Button
                                size="sm"
                                disabled={!canFund}
                                onClick={() => setFundOpen(true)}
                            >
                                Fund wallet
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Stat
                        label="Available"
                        value={formatMoney(available)}
                        hint="Spendable now"
                    />
                    <Stat
                        label="Held"
                        value={formatMoney(Number(wallet.held))}
                        hint="Reserved by an in-flight purchase"
                        tone="muted"
                    />
                    <Stat
                        label="Posted"
                        value={formatMoney(Number(wallet.posted))}
                        hint="Everything credited minus everything settled"
                        tone="muted"
                    />
                </div>

                {frozen ? (
                    <p className="rounded-lg border border-[color-mix(in_srgb,var(--vms-warning-accent)_30%,white)] bg-[var(--vms-coral-soft)] px-3 py-2 text-xs leading-5 text-[var(--vms-ink)]">
                        This wallet is frozen, so it cannot fund a purchase. Ask the
                        organization administrator to review it.
                    </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--vms-line)] pt-3 text-xs">
                    <Link
                        href={`/workspace/${placeId}/charges`}
                        className="inline-flex items-center gap-1 font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                    >
                        Pay a charge from this wallet
                        <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                    </Link>
                    <span className="text-[var(--vms-ink-muted)]">
                        One wallet per Party and currency. It is never shared between
                        organizations.
                    </span>
                </div>
            </div>
            {dialog}
        </section>
    );
}
