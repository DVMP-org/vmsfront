"use client";

import { usePlaceWorkspace } from "@/features/place-workspace/PlaceWorkspaceShell";

import { WalletActivityList } from "./WalletActivityList";
import { WalletPendingTopUps } from "./WalletPendingTopUps";
import { WalletSummaryCard } from "./WalletSummaryCard";

/**
 * The Party's own wallet page: balance first, anything still being verified,
 * then the immutable journal history.
 */
export function WalletSection() {
  const context = usePlaceWorkspace();
  const placeId = context.place.id;

  return (
    <div className="space-y-5">
      <WalletSummaryCard placeId={placeId} variant="full" />
      <WalletPendingTopUps placeId={placeId} />
      <WalletActivityList placeId={placeId} />
    </div>
  );
}
