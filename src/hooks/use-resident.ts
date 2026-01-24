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
  HouseDue,
  DueSchedule,
  DuePayment,
  DashboardSelect,
  Transaction,
} from "@/types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";
import { useAuthStore } from "@/store/auth-store";
import { generalService } from "@/services/general-service";


export function useResidentDashboardSelect() {
  return useQuery<DashboardSelect>({
    queryKey: ["resident", "dashboard-select"],
    queryFn: async () => {
      const response = await residentService.getDashboardSelect();
      const user = response.data;

      return user;
    },
    enabled: useAuthStore.getState().isAuthenticated,
  });
}

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
  params: {
    page: number;
    pageSize: number;
    search?: string;
    sort?: string;
    filters?: string
  }
) {
  return useQuery<PaginatedResponse<GatePass>>({
    queryKey: ["resident", "gate-passes", houseId, params],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await residentService.getGatePasses(
        houseId,
        params
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
  params: {
    page: number;
    pageSize: number;
    search?: string;
    sort?: string;
    filters?: string
  }
) {
  return useQuery({
    queryKey: ["resident", "visitors", houseId, params],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await residentService.getVisitors(
        houseId,
        params
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

export function useWalletHistory(
  params: {
    page: number,
    pageSize: number,
    search?: string,
    sort?: string,
    filters?: string
  }
) {
  return useQuery<PaginatedResponse<WalletTransaction>>({
    queryKey: ["resident", "wallet", "history", params],
    queryFn: async () => {
      const response = await residentService.getWalletHistory(params);
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

export function useHouseDues(
  houseId: string | null,
  params: {
    page: number;
    pageSize: number;
    search?: string;
    sort?: string;
    filters?: string
  }
) {
  return useQuery<PaginatedResponse<HouseDue>>({
    queryKey: ["resident", "house-dues", houseId, params],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await residentService.getHouseDues(houseId, params);
      return response.data;
    },
    enabled: !!houseId,
  });
}

export function useHouseDue(houseId: string | null, dueId: string | null) {
  return useQuery({
    queryKey: ["resident", "house-due", houseId, dueId],
    queryFn: async () => {
      if (!dueId) throw new Error("Due ID is required");
      if (!houseId) throw new Error("House ID is required");
      const response = await residentService.getHouseDue(houseId, dueId);
      return response.data;
    },
    enabled: !!dueId && !!houseId,
  });
}

export function useScheduleHouseDue(houseId: string | null, dueId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { payment_breakdown: string }) => {
      if (!dueId || !houseId) throw new Error("Due ID and House ID are required");
      return residentService.scheduleHouseDue(houseId, dueId, data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "house-due", houseId, dueId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "house-dues", houseId] });
      toast.success("Payment schedule updated successfully!");
      return response.data;
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useDueSchedules(
  houseId: string | null,
  dueId: string | null,
  page: number = 1,
  pageSize: number = 10,
  filters?: string
) {
  return useQuery({
    queryKey: ["resident", "due-schedules", houseId, dueId, page, pageSize, filters],
    queryFn: async () => {
      if (!houseId || !dueId) throw new Error("House and Due ID are required");
      const response = await residentService.getDueSchedules(houseId, dueId, page, pageSize, filters);
      return response.data;
    },
    enabled: !!houseId && !!dueId,
  });
}

export function useDuePayments(
  houseId: string | null,
  dueId: string | null,
  page: number = 1,
  pageSize: number = 10,
  filters?: string
) {
  return useQuery({
    queryKey: ["resident", "due-payments", houseId, dueId, page, pageSize, filters],
    queryFn: async () => {
      if (!houseId || !dueId) throw new Error("House and Due ID are required");
      const response = await residentService.getDuePayments(houseId, dueId, page, pageSize, filters);
      return response.data;
    },
    enabled: !!houseId && !!dueId,
  });
}

export function usePayDueSchedule(houseId: string | null, dueId: string | null) {
  return useMutation({
    mutationFn: (scheduleId: string) => {
      if (!houseId || !dueId) throw new Error("House and Due ID are required");
      return residentService.payDueSchedule(houseId, dueId, scheduleId);
    },
    onSuccess: (response) => {
      return response.data;
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useTransaction(reference: string | null) {
  return useQuery<Transaction>({
    queryKey: ["resident", "transaction", reference],
    queryFn: async () => {
      if (!reference) throw new Error("Reference is required");
      const response = await generalService.getTransaction(reference);
      return response.data;
    },
    enabled: !!reference,
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "pending" || !data) {
        return 3000;
      }
      return false;
    },
    refetchIntervalInBackground: true,
  });
}

export function useAddVisitorsToGatePass(houseId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passId, data }: { passId: string; data: { name: string; email: string; phone?: string }[] }) => {
      if (!houseId) throw new Error("House ID is required");
      return residentService.addVisitorsToGatePass(houseId, passId, data);
    },
    onSuccess: (_, { passId }) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-pass", houseId, passId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", houseId] });
      // Invalidate specific visitor queries if necessary
      toast.success("Visitors added successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useRemoveVisitorFromGatePass(houseId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passId, visitorIds }: { passId: string; visitorIds: string[] }) => {
      if (!houseId) throw new Error("House ID is required");
      return residentService.removeVisitorFromGatePass(houseId, passId, visitorIds);
    },
    onSuccess: (_, { passId }) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-pass", houseId, passId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", houseId] });
      toast.success("Visitor removed successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useUploadVisitorsToGatePass(houseId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passId, data }: { passId: string; data: FormData }) => {
      if (!houseId) throw new Error("House ID is required");
      return residentService.uploadVisitorsToGatePass(houseId, passId, data);
    },
    onSuccess: (_, { passId }) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-pass", houseId, passId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", houseId] });
      toast.success("Visitors uploaded successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}
