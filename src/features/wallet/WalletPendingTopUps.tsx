"use client";

import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { NoticeBanner } from "@/features/place-workspace/ui";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

import { usePendingTopUps } from "./queries";

/**
 * Top-ups the gateway has not confirmed yet.
 *
 * Money is not credited on the redirect back to the app, so this is the only
 * honest place to show "we have your payment, the balance will move shortly".
 */
export function WalletPendingTopUps({ placeId }: { placeId: string }) {
    const pending = usePendingTopUps(placeId);
    const items = pending.data?.items ?? [];
    if (items.length === 0) return null;

    const first = items[0];
    const others = items.length - 1;

    return (
        <NoticeBanner
            icon={Clock3}
            title={
                <span className="flex flex-wrap items-center gap-2">
                    Waiting for payment confirmation
                    <Badge variant="warning">
                        {items.length} pending
                    </Badge>
                </span>
            }
        >
            {formatMoney(Number(first.amount))} {first.currency}
            {first.gateway ? ` via ${first.gateway}` : ""} started{" "}
            {formatDate(first.created_at)}. Your balance updates the moment the
            gateway verifies it — nothing is lost in the meantime
            {others > 0 ? `, and ${others} more top-up(s) are queued` : ""}.
        </NoticeBanner>
    );
}
