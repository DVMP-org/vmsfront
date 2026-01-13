import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { residentService } from "@/services/resident-service";
import {
  CreateGatePassRequest,
  GatePass,
  PaginatedResponse,
  ResidentUserCreate,
  Wallet,
  FundWalletRequest,
  WalletTransaction,
  UpdateHouseRequest,
} from "@/types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";

export function useResidentHouses() {
  return useQuery({
    queryKey: ["resident", "houses"],
    queryFn: async () => {
      const response = await residentService.getHouses();
      return response.data;
    },
  });
}

export function useResidentDashboard(houseId: string | null) {
  return useQuery({
    queryKey: ["resident", "dashboard", houseId],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await residentService.getDashboard(houseId);
      return response.data;
    },
    enabled: !!houseId,
  });
}


export function useResidentHouse(houseId: string | null) {
  return useQuery({
    queryKey: ["resident", "house", houseId],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required")
      const response = await residentService.getResidentHouse(houseId);
      return response.data;
    },
    enabled: !!houseId,
  });
}

export function useUpdateHouse(houseId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateHouseRequest) => {
      if (!houseId) throw new Error("House ID is required");
      return residentService.updateHouse(houseId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "house", houseId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "houses"] });
      toast.success("House details updated successfully");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useGatePasses(
  houseId: string | null,
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery<PaginatedResponse<GatePass>>({
    queryKey: ["resident", "gate-passes", houseId, page, pageSize],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await residentService.getGatePasses(
        houseId,
        page,
        pageSize
      );
      return response.data;
    },
    enabled: !!houseId,
  });
}

export function useGatePass(houseId: string | null, passId: string | null) {
  return useQuery({
    queryKey: ["resident", "gate-pass", houseId, passId],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      if (!passId) throw new Error("Pass ID is required");
      const response = await residentService.getGatePass(houseId, passId);
      return response.data;
    },
    enabled: !!houseId && !!passId,
  });
}

export function useResident() {
  return useQuery({
    queryKey: ["resident", "me"],
    queryFn: async () => {
      const response = await residentService.getResident();
      return response.data;
    },
  });
}

export function useCreateGatePass(houseId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGatePassRequest) => {
      if (!houseId) throw new Error("House ID is required");
      return residentService.createGatePass(houseId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", houseId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "dashboard", houseId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "visitors", houseId] });
      toast.success("Gate pass created successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useRevokeGatePass(houseId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (passId: string) => {
      if (!houseId) throw new Error("House ID is required");
      return residentService.revokeGatePass(houseId, passId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", houseId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "dashboard", houseId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "visitors", houseId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "gate-passes"] });
      toast.success("Gate pass revoked successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useVisitors(
  houseId: string | null,
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: ["resident", "visitors", houseId, page, pageSize],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await residentService.getVisitors(
        houseId,
        page,
        pageSize
      );
      return response.data;
    },
    enabled: !!houseId,
  });
}

export function useVisitorsByGatePass(houseId: string | null, gatePassId: string | null) {
  return useQuery({
    queryKey: ["resident", "visitors", houseId, "gate-pass", gatePassId],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      if (!gatePassId) throw new Error("Gate pass ID is required");
      const response = await residentService.getVisitorsByGatePass(houseId, gatePassId);
      return response.data;
    },
    enabled: !!houseId && !!gatePassId,
  });
}

export function useVisitor(
  houseId: string | null,
  visitorId: string | null
) {
  return useQuery({
    queryKey: ["resident", "visitor", houseId, visitorId],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      if (!visitorId) throw new Error("Visitor ID is required");
      const response = await residentService.getVisitor(houseId, visitorId);
      return response.data;
    },
    enabled: !!houseId && !!visitorId,
  });
}

export function useResidentOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResidentUserCreate) => residentService.onboardResident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "me"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "select"] });
      toast.success("You're now onboarded as a resident!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ["resident", "wallet"],
    queryFn: async () => {
      const response = await residentService.getWallet();
      return response.data;
    },
  });
}

export function useWalletHistory(page: number = 1, pageSize: number = 20) {
  return useQuery<PaginatedResponse<WalletTransaction>>({
    queryKey: ["resident", "wallet", "history", page, pageSize],
    queryFn: async () => {
      const response = await residentService.getWalletHistory(page, pageSize);
      return response.data;
    },
  });
}

export function useWalletTransaction(reference: string | null) {
  return useQuery<WalletTransaction>({
    queryKey: ["resident", "wallet", "transaction", reference],
    queryFn: async () => {
      if (!reference) throw new Error("Reference is required");
      const response = await residentService.getWalletTransaction(reference);
      return response.data;
    },
    enabled: !!reference,
    retry: 5, // Retry up to 5 times before giving up
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchInterval: (query) => {
      // Poll every 3 seconds if transaction is pending or if we don't have data yet
      const data = query.state.data;
      if (data?.status === "pending" || !data) {
        return 3000;
      }
      return false;
    },
    // Continue polling for up to 60 seconds
    refetchIntervalInBackground: true,
  });
}

export function useFundWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FundWalletRequest) => residentService.fundWallet(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "wallet"] });
      return response.data;
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}
