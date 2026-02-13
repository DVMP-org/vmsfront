import { queryClient } from "@/lib/query-client";
import { integrationService } from "@/services/integration-service";
import { PaginatedResponse } from "@/types";
import { CredentialFormValues, Integration, IntegrationCredentials } from "@/types/integration";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";


export function useIntegrations(params: {
  page: number,
  pageSize: number,
  search?: string | null,
  filters?: string | null,
  sort?: string | null,
}) {
  return useQuery<PaginatedResponse<Integration>>({
    queryKey: ["integrations", params],
    queryFn: async () => {
      const response = await integrationService.getIntegrations({
        search: params.search || undefined,
        filters: params.filters || undefined,
        sort: params.sort || undefined,
      });
      return response.data;
    },
  });
}


export function useIntegration(integrationId: string | null) {
  return useQuery<Integration>({
    queryKey: ["integration", integrationId],
    queryFn: async () => {
      if (!integrationId) throw new Error("Integration ID is required")
      const response = await integrationService.getIntegrationById(integrationId);
      return response.data;
    },
    enabled: !!integrationId,
  });
}


export function useEnableIntegration() {
  return useMutation({
    mutationFn: async (name: string) => {
      return integrationService.enableIntegration(name);
    },
    onSuccess: (_data, name) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integration", name] });
      toast.success("Integration enabled successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to enable integration");
    },
  });
}

export function useDisableIntegration() {
  return useMutation({
    mutationFn: async (name: string) => {
      return integrationService.disableIntegration(name);
    },
    onSuccess: (_data, name) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integration", name] });
      toast.success("Integration disabled successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to disable integration");
    },
  });
}

export function useUpdateIntegrationCredentials(integrationId: string) {
  return useMutation({
    mutationFn: async (credentials: IntegrationCredentials) => {
      return integrationService.updateIntegrationCredentials(integrationId, credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integration", integrationId] });
      toast.success("Integration updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update integration");
    },
  });
}