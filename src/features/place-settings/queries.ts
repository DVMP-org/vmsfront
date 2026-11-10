"use client";

/**
 * Query layer for Place settings.
 *
 * Screens import these hooks instead of calling `useQuery` with inline
 * fetchers, so cache keys, invalidation and defaults live in one place.
 */

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from "@tanstack/react-query";

import {
    placeSettingsApi,
    type HouseholdMember,
    type PlacePreferences,
} from "./api";

export const placeSettingsKeys = {
    all: (placeId: string) => ["place-settings", placeId] as const,
    preferences: (placeId: string) =>
        ["place-settings", placeId, "preferences"] as const,
    members: (placeId: string) => ["place-settings", placeId, "members"] as const,
};

export function usePlacePreferences(
    placeId: string,
): UseQueryResult<PlacePreferences> {
    return useQuery({
        queryKey: placeSettingsKeys.preferences(placeId),
        queryFn: () => placeSettingsApi.preferences(placeId),
        staleTime: 60_000,
        retry: false,
    });
}

export function useSavePlacePreferences(
    placeId: string,
): UseMutationResult<PlacePreferences, Error, PlacePreferences> {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (preferences: PlacePreferences) =>
            placeSettingsApi.savePreferences(placeId, preferences),
        onSuccess: (preferences) => {
            client.setQueryData(placeSettingsKeys.preferences(placeId), preferences);
        },
    });
}

export function useHouseholdMembers(
    placeId: string,
    options: { enabled?: boolean } = {},
): UseQueryResult<HouseholdMember[]> {
    return useQuery({
        queryKey: placeSettingsKeys.members(placeId),
        queryFn: () => placeSettingsApi.members(placeId),
        enabled: options.enabled ?? true,
        retry: false,
    });
}

export function useAddHouseholdMember(placeId: string): UseMutationResult<
    unknown,
    Error,
    { display_name: string; email: string; role: string }
> {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (body: { display_name: string; email: string; role: string }) =>
            placeSettingsApi.addMember(placeId, body),
        onSuccess: () => {
            void client.invalidateQueries({
                queryKey: placeSettingsKeys.members(placeId),
            });
            void client.invalidateQueries({ queryKey: ["auth", "verify"] });
            void client.invalidateQueries({ queryKey: ["place-workspace"] });
        },
    });
}

export function useRemoveHouseholdMember(
    placeId: string,
): UseMutationResult<unknown, Error, string> {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (relationshipId: string) =>
            placeSettingsApi.removeMember(placeId, relationshipId),
        onSuccess: () => {
            void client.invalidateQueries({
                queryKey: placeSettingsKeys.members(placeId),
            });
            void client.invalidateQueries({ queryKey: ["auth", "verify"] });
        },
    });
}
