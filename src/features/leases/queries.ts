"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";

import { placeRelationshipsApi, placesApi } from "@/features/places/api";

import {
    leasesApi,
    type LeaseInput,
    type LeaseTerminateInput,
    type LeaseUpdateInput,
} from "./api";

export type LeaseFilters = {
    status?: string;
    search?: string;
    place_id?: string;
    party_id?: string;
};

export const leaseKeys = {
    all: (siteId?: string | null) => ["leases", siteId ?? "no-site"] as const,
    list: (siteId: string | null | undefined, filters: LeaseFilters) =>
        [...leaseKeys.all(siteId), "list", filters] as const,
    detail: (siteId: string | null | undefined, id: string) =>
        [...leaseKeys.all(siteId), "detail", id] as const,
    plan: (siteId: string | null | undefined, id: string) =>
        [...leaseKeys.all(siteId), "plan", id] as const,
};

/**
 * Leases always belong to the selected Site, so the Site is part of every key.
 * Confirming a lease writes charge rows, so the commercial caches are refreshed
 * alongside the lease caches.
 */
function useInvalidateLeases(siteId?: string | null) {
    const client = useQueryClient();
    return async () => {
        await Promise.all([
            client.invalidateQueries({ queryKey: leaseKeys.all(siteId) }),
            client.invalidateQueries({ queryKey: ["commercial"] }),
        ]);
    };
}

export function useLeases(
    siteId: string | null | undefined,
    filters: LeaseFilters = {},
) {
    return useQuery({
        queryKey: leaseKeys.list(siteId, filters),
        queryFn: () => leasesApi.list(filters),
        enabled: Boolean(siteId),
        staleTime: 30_000,
    });
}

export type PlaceOption = { id: string; name: string; kind: string };
export type PartyOption = { id: string; display_name: string };

/** Spaces a lease can cover, flattened from the Site's place tree. */
export function useLeasePlaceOptions(siteId: string | null | undefined) {
    return useQuery({
        queryKey: ["leases", siteId ?? "no-site", "place-options"] as const,
        queryFn: () => placesApi.tree(siteId!),
        enabled: Boolean(siteId),
        staleTime: 60_000,
        select: (roots): PlaceOption[] => {
            const options: PlaceOption[] = [];
            const visit = (nodes: typeof roots) => {
                for (const node of nodes) {
                    options.push({ id: node.id, name: node.name, kind: node.kind });
                    if (node.children?.length) visit(node.children);
                }
            };
            visit(roots);
            return options.sort((a, b) => a.name.localeCompare(b.name));
        },
    });
}

/**
 * Parties already attached to a specific Place.
 *
 * A lease names someone who occupies the space it covers, so the party list is
 * the occupancy of that space — not the whole Site register. Offering everyone
 * let an operator draft a lease for a party who was never in the space.
 */
export function usePlacePartyOptions(
    siteId: string | null | undefined,
    placeId: string | null | undefined,
) {
    return useQuery({
        queryKey: [
            "leases",
            siteId ?? "no-site",
            "place-parties",
            placeId ?? "none",
        ] as const,
        queryFn: async () => {
            const result = await placeRelationshipsApi.list({
                place_id: placeId!,
                status: "active",
            });
            const seen = new Map<string, PartyOption>();
            for (const relationship of result.items) {
                seen.set(relationship.party.id, {
                    id: relationship.party.id,
                    display_name: relationship.party.display_name,
                });
            }
            return [...seen.values()].sort((a, b) =>
                a.display_name.localeCompare(b.display_name),
            );
        },
        enabled: Boolean(siteId && placeId),
        staleTime: 15_000,
    });
}

/**
 * Parties already attached to the Site, as lease candidates.
 *
 * Reading them from place relationships keeps one definition of "who is on this
 * Site": a lease always names a party the Site already knows.
 */
export function useLeasePartyOptions(siteId: string | null | undefined) {
    return useQuery({
        queryKey: ["leases", siteId ?? "no-site", "party-options"] as const,
        queryFn: async () => {
            const result = await placeRelationshipsApi.list();
            const seen = new Map<string, PartyOption>();
            for (const relationship of result.items) {
                seen.set(relationship.party.id, {
                    id: relationship.party.id,
                    display_name: relationship.party.display_name,
                });
            }
            return [...seen.values()].sort((a, b) =>
                a.display_name.localeCompare(b.display_name),
            );
        },
        enabled: Boolean(siteId),
        staleTime: 60_000,
    });
}

export function useLease(
    siteId: string | null | undefined,
    leaseId: string | null | undefined,
) {
    return useQuery({
        queryKey: leaseKeys.detail(siteId, leaseId ?? "none"),
        queryFn: () => leasesApi.get(leaseId!),
        enabled: Boolean(siteId && leaseId),
    });
}

/** The preview of what confirming would create. Only fetched when asked for. */
export function useLeasePlan(
    siteId: string | null | undefined,
    leaseId: string | null | undefined,
    enabled: boolean,
) {
    return useQuery({
        queryKey: leaseKeys.plan(siteId, leaseId ?? "none"),
        queryFn: () => leasesApi.plan(leaseId!),
        enabled: Boolean(siteId && leaseId && enabled),
        staleTime: 0,
    });
}

export function useCreateLease(siteId?: string | null) {
    const invalidate = useInvalidateLeases(siteId);
    return useMutation({
        mutationFn: (input: LeaseInput) => leasesApi.create(input),
        onSuccess: async (lease) => {
            await invalidate();
            toast.success(
                `Draft lease for ${lease.party_name ?? "the party"} saved`,
            );
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useUpdateLease(siteId?: string | null) {
    const invalidate = useInvalidateLeases(siteId);
    return useMutation({
        mutationFn: ({ id, ...input }: LeaseUpdateInput & { id: string }) =>
            leasesApi.update(id, input),
        onSuccess: async () => {
            await invalidate();
            toast.success("Lease updated");
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useActivateLease(siteId?: string | null) {
    const invalidate = useInvalidateLeases(siteId);
    return useMutation({
        mutationFn: (id: string) => leasesApi.activate(id),
        onSuccess: async (lease) => {
            await invalidate();
            const billed = lease.charge_lines.filter(
                (line) => line.status === "applied",
            ).length;
            toast.success(
                billed === 1
                    ? "Lease is live and 1 charge was created"
                    : `Lease is live and ${billed} charges were created`,
            );
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useTerminateLease(siteId?: string | null) {
    const invalidate = useInvalidateLeases(siteId);
    return useMutation({
        mutationFn: ({ id, ...input }: LeaseTerminateInput & { id: string }) =>
            leasesApi.terminate(id, input),
        onSuccess: async (lease) => {
            await invalidate();
            toast.success(
                lease.status === "cancelled"
                    ? "Draft lease cancelled"
                    : "Lease terminated; arrears remain collectable",
            );
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}
