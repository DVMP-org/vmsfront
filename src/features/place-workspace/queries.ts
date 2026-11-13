"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";

import { placeWorkspaceApi } from "./api";

export const workspaceAgreementKeys = {
  leases: (placeId: string, partyId: string) =>
    ["place-leases", placeId, partyId] as const,
};

/** The caller's own agreements on this Place. */
export function useLeaseAgreements(
  placeId: string | null | undefined,
  partyId: string | null | undefined,
) {
  return useQuery({
    queryKey: workspaceAgreementKeys.leases(placeId ?? "none", partyId ?? "none"),
    queryFn: () => placeWorkspaceApi.leases(placeId!),
    enabled: Boolean(placeId && partyId),
    retry: false,
  });
}

/**
 * Acknowledge the terms. Billing already started when an administrator
 * confirmed the lease, so this changes nothing about money.
 */
export function useAcceptLease(
  placeId: string | null | undefined,
  partyId: string | null | undefined,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: string) => placeWorkspaceApi.acceptLease(placeId!, leaseId),
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: workspaceAgreementKeys.leases(
          placeId ?? "none",
          partyId ?? "none",
        ),
      });
      toast.success("You accepted the lease terms");
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
}
