import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

/**
 * Party wallet API. The wallet belongs to a Party and an organization; the
 * Place in the path is the workspace the Party is acting from. Every amount is
 * returned in minor units as well as major units, so callers never round money.
 */
export interface WalletSummary {
    wallet_id: string;
    organization_id: string;
    party_id: string;
    currency: string;
    status: "active" | "frozen" | "closed";
    posted_minor: number;
    held_minor: number;
    available_minor: number;
    posted: string;
    held: string;
    available: string;
    as_of: string;
}

export interface WalletTopUpRequest {
    amount: string;
    description?: string;
}

export interface WalletTopUpResponse {
    reference: string;
    funding_intent_id: string;
    transaction_id: string;
    gateway: string;
    payment: Record<string, unknown>;
}

export interface WalletJournalLine {
    account: string;
    direction: "debit" | "credit";
    amount: string;
    amount_minor: number;
}

export interface WalletJournalEntry {
    id: string;
    reference: string;
    kind: "funding" | "settlement" | "refund" | "adjustment";
    description?: string | null;
    source_module?: string | null;
    source_reference?: string | null;
    site_id?: string | null;
    place_id?: string | null;
    amount: string;
    amount_minor: number;
    currency: string;
    direction: "debit" | "credit";
    created_at: string;
    /** The balanced ledger lines, for the receipt view. */
    lines?: WalletJournalLine[];
}

export interface WalletActivity {
    items: WalletJournalEntry[];
    total: number;
    page: number;
    page_size: number;
}

export interface WalletFundingIntent {
    id: string;
    reference: string;
    amount: string;
    amount_minor: number;
    currency: string;
    status: "pending" | "verified" | "failed" | "expired";
    gateway?: string | null;
    created_at: string;
    verified_at?: string | null;
    failure_reason?: string | null;
}

export interface WalletFundingIntentList {
    items: WalletFundingIntent[];
    total: number;
}

export interface WalletActivityFilters {
    kind?: string;
    sourceModule?: string;
}

const path = (placeId: string) =>
    `/workspace/places/${encodeURIComponent(placeId)}/wallet`;

export const walletApi = {
    summary: async (placeId: string) =>
        (await apiClient.get<ApiResponse<WalletSummary>>(path(placeId))).data,
    topUp: async (placeId: string, body: WalletTopUpRequest) =>
        (
            await apiClient.post<ApiResponse<WalletTopUpResponse>>(
                `${path(placeId)}/top-up`,
                body,
            )
        ).data,
    activity: async (
        placeId: string,
        page = 1,
        pageSize = 20,
        filters: WalletActivityFilters = {},
    ) =>
        (
            await apiClient.get<ApiResponse<WalletActivity>>(`${path(placeId)}/activity`, {
                params: {
                    page,
                    page_size: pageSize,
                    kind: filters.kind || undefined,
                    source_module: filters.sourceModule || undefined,
                },
            })
        ).data,
    fundingIntents: async (placeId: string) =>
        (
            await apiClient.get<ApiResponse<WalletFundingIntentList>>(
                `${path(placeId)}/funding-intents`,
            )
        ).data,
};
