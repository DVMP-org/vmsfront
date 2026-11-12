"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";

import {
  contractorsApi,
  type ContractorInput,
  type ContractorUpdateInput,
} from "./api";

export const contractorKeys = {
  list: (siteId?: string | null) =>
    ["contractors", siteId ?? "no-site", "list"] as const,
};

/** Contractors belong to the selected Site; pass it so caches never leak. */
export function useContractors(siteId?: string | null) {
  return useQuery({
    queryKey: contractorKeys.list(siteId),
    queryFn: () => contractorsApi.list(),
    enabled: Boolean(siteId),
    staleTime: 30_000,
  });
}

export function useCreateContractor(siteId?: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ContractorInput) => contractorsApi.create(input),
    onSuccess: async (contractor) => {
      await client.invalidateQueries({ queryKey: contractorKeys.list(siteId) });
      toast.success(`${contractor.contact_name} was invited as a contractor`);
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
}

export function useUpdateContractor(siteId?: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: ContractorUpdateInput & { id: string }) =>
      contractorsApi.update(id, input),
    onSuccess: async (contractor) => {
      await client.invalidateQueries({ queryKey: contractorKeys.list(siteId) });
      toast.success(`${contractor.contact_name} updated`);
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
}

export function useRevokeContractor(siteId?: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractorsApi.revoke(id),
    onSuccess: async (contractor) => {
      await client.invalidateQueries({ queryKey: contractorKeys.list(siteId) });
      toast.success(`${contractor.contact_name}'s access was revoked`);
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
}
