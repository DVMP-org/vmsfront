"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";

import {
    walletApi,
    type WalletActivityFilters,
    type WalletTopUpRequest,
} from "./api";

export const walletKeys = {
    all: (placeId: string) => ["wallet", placeId] as const,
    summary: (placeId: string) => ["wallet", placeId, "summary"] as const,
    pending: (placeId: string) => ["wallet", placeId, "pending"] as const,
    activity: (placeId: string, page: number, filters: WalletActivityFilters) =>
        [
            "wallet",
            placeId,
            "activity",
            page,
            filters.kind ?? "all",
            filters.sourceModule ?? "all",
        ] as const,
};

/** The Party's wallet in this workspace. */
export function useWallet(placeId: string | null | undefined) {
    return useQuery({
        queryKey: walletKeys.summary(placeId ?? "none"),
        queryFn: () => walletApi.summary(placeId!),
        enabled: Boolean(placeId),
        retry: false,
    });
}

export function useWalletActivity(
    placeId: string | null | undefined,
    page = 1,
    pageSize = 20,
    filters: WalletActivityFilters = {},
) {
    return useQuery({
        queryKey: walletKeys.activity(placeId ?? "none", page, filters),
        queryFn: () => walletApi.activity(placeId!, page, pageSize, filters),
        enabled: Boolean(placeId),
        retry: false,
        // Journals are immutable; keep the previous page visible while the next
        // one loads so the list does not collapse to a spinner.
        placeholderData: (previous) => previous,
    });
}

/** Top-ups the gateway has not verified yet. */
export function usePendingTopUps(placeId: string | null | undefined) {
    return useQuery({
        queryKey: walletKeys.pending(placeId ?? "none"),
        queryFn: () => walletApi.fundingIntents(placeId!),
        enabled: Boolean(placeId),
        retry: false,
        // Only poll while something is actually waiting to be confirmed.
        refetchInterval: (query) =>
            (query.state.data?.items?.length ?? 0) > 0 ? 15000 : false,
    });
}

/**
 * Start a top-up. The wallet is credited only after the gateway confirms the
 * payment server-side, never when the browser returns to the success page.
 */
export function useTopUpWallet(placeId: string | null | undefined) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (body: WalletTopUpRequest) => walletApi.topUp(placeId!, body),
        onSuccess: async () => {
            // The credit lands asynchronously with the provider callback, so refetch
            // rather than assuming the balance changed.
            await Promise.all([
                client.invalidateQueries({
                    queryKey: walletKeys.summary(placeId ?? "none"),
                }),
                client.invalidateQueries({
                    queryKey: walletKeys.pending(placeId ?? "none"),
                }),
            ]);
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}
