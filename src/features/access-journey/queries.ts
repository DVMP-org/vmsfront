"use client";

/**
 * Invitation query layer.
 *
 * Screens import these hooks instead of wiring `useQuery` inline, so cache
 * keys, invalidation and user feedback live in one place.
 */

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";
import {
    accessJourneyApi,
    type CreateVisitAuthorizationInput,
    type VisitAuthorization,
} from "./api";

export const accessJourneyKeys = {
    all: ["workspace", "visit-authorizations"] as const,
    list: (placeId: string, partyId: string) =>
        ["workspace", "visit-authorizations", placeId, partyId] as const,
    detail: (invitationId: string) =>
        ["workspace", "visit-authorizations", "detail", invitationId] as const,
    checkpoints: (invitationId: string) =>
        ["workspace", "visit-authorizations", "checkpoints", invitationId] as const,
    credentials: (invitationId: string) =>
        ["workspace", "visit-authorizations", "credentials", invitationId] as const,
};

/** Thrown when a query is enabled without the id it needs. */
const required = (value: string | null | undefined, label: string) => {
    if (!value) throw new Error(`${label} is required`);
    return value;
};

export function usePlaceInvitations(
    placeId: string,
    partyId: string,
): UseQueryResult<{ items: VisitAuthorization[] }> {
    return useQuery({
        queryKey: accessJourneyKeys.list(placeId, partyId),
        queryFn: () => accessJourneyApi.list(placeId),
        retry: false,
    });
}

export function useCreateInvitation(options: {
  onSuccess?: () => void | Promise<void>;
  onError?: (error: Error) => void;
} = {}): UseMutationResult<
  VisitAuthorization,
  Error,
  CreateVisitAuthorizationInput
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: accessJourneyApi.create,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: accessJourneyKeys.all });
      await options.onSuccess?.();
    },
    onError: (error) => options.onError?.(error as Error),
    });
}

export function useCancelInvitation(): UseMutationResult<
    VisitAuthorization,
    Error,
    string
> {
    const client = useQueryClient();
    return useMutation({
        mutationFn: accessJourneyApi.cancel,
        onSuccess: async () => {
            toast.success("Invitation cancelled");
            await client.invalidateQueries({ queryKey: accessJourneyKeys.all });
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useRevokeInvitation(): UseMutationResult<
    VisitAuthorization,
    Error,
    string
> {
    const client = useQueryClient();
    return useMutation({
        mutationFn: accessJourneyApi.revoke,
        onSuccess: async () => {
            toast.success("Invitation revoked");
            await client.invalidateQueries({ queryKey: accessJourneyKeys.all });
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useUpdateInvitation(
    invitationId: string,
): UseMutationResult<
    VisitAuthorization,
    Error,
    Parameters<typeof accessJourneyApi.update>[1]
> {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (body: Parameters<typeof accessJourneyApi.update>[1]) =>
            accessJourneyApi.update(invitationId, body),
        onSuccess: async () => {
            toast.success("Invitation updated");
            await client.invalidateQueries({ queryKey: accessJourneyKeys.all });
        },
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useInvitation(
    invitationId: string | null,
): UseQueryResult<VisitAuthorization> {
    return useQuery({
        queryKey: accessJourneyKeys.detail(invitationId ?? "none"),
        queryFn: () => accessJourneyApi.get(required(invitationId, "Invitation")),
        enabled: Boolean(invitationId),
        retry: false,
    });
}

export function useInvitationCheckpoints(
    invitationId: string | null,
): UseQueryResult<Awaited<ReturnType<typeof accessJourneyApi.checkpointEvents>>> {
    return useQuery({
        queryKey: accessJourneyKeys.checkpoints(invitationId ?? "none"),
        queryFn: () =>
            accessJourneyApi.checkpointEvents(required(invitationId, "Invitation")),
        enabled: Boolean(invitationId),
        retry: false,
    });
}

export function useInvitationCredentials(
    invitationId: string | null,
): UseQueryResult<Awaited<ReturnType<typeof accessJourneyApi.credentials>>> {
    return useQuery({
        queryKey: accessJourneyKeys.credentials(invitationId ?? "none"),
        queryFn: () =>
            accessJourneyApi.credentials(required(invitationId, "Invitation")),
        enabled: Boolean(invitationId),
        retry: false,
    });
}
