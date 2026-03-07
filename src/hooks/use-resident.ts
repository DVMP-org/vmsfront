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
  UpdateResidencyRequest,
  ResidencyDue,
  DueSchedule,
  DuePayment,
  DashboardSelect,
  Transaction,
  CreateGatePassData,
  VisitResponse,
} from "@/types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";
import { useAuthStore } from "@/store/auth-store";
import { generalService } from "@/services/general-service";


export function useResidentDashboardSelect() {
  const { isAuthenticated, _hasHydrated, token } = useAuthStore();
  
  return useQuery<DashboardSelect>({
    queryKey: ["resident", "dashboard-select"],
    queryFn: async () => {
      const response = await residentService.getDashboardSelect();
      const user = response.data;

      return user;
    },
    enabled: _hasHydrated && (isAuthenticated || !!token),
  });
}

export function useResidentResidencies() {
  return useQuery({
    queryKey: ["resident", "residencies"],
    queryFn: async () => {
      const response = await residentService.getResidencies();
      return response.data;
    },
  });
}

export function useResidentDashboard(residencyId: string | null) {
  return useQuery({
    queryKey: ["resident", "dashboard", residencyId],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required");
      const response = await residentService.getDashboard(residencyId);
      return response.data;
    },
    enabled: !!residencyId,
  });
}


export function useResidentResidency(residencyId: string | null) {
  return useQuery({
    queryKey: ["resident", "residency", residencyId],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required")
      const response = await residentService.getResidentResidency(residencyId);
      return response.data;
    },
    enabled: !!residencyId,
  });
}

export function useUpdateResidency(residencyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateResidencyRequest) => {
      if (!residencyId) throw new Error("Residency ID is required");
      return residentService.updateResidency(residencyId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "residency", residencyId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "residencies"] });
      toast.success("Residency details updated successfully");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useGatePasses(
  residencyId: string | null,
  params: {
    page: number;
    pageSize: number;
    search?: string;
    sort?: string;
    filters?: string
  }
) {
  return useQuery<PaginatedResponse<GatePass>>({
    queryKey: ["resident", "gate-passes", residencyId, params],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required");
      const response = await residentService.getGatePasses(
        residencyId,
        params
      );
      return response.data;
    },
    enabled: !!residencyId,
  });
}

export function useGatePass(residencyId: string | null, passId: string | null) {
  return useQuery({
    queryKey: ["resident", "gate-pass", residencyId, passId],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required");
      if (!passId) throw new Error("Pass ID is required");
      const response = await residentService.getGatePass(residencyId, passId);
      return response.data;
    },
    enabled: !!residencyId && !!passId,
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

export function useCreateGatePass(residencyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGatePassRequest) => {
      if (!residencyId) throw new Error("Residency ID is required");
      return residentService.createGatePass(residencyId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", residencyId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "dashboard", residencyId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "visitors", residencyId] });
      toast.success("Gate pass created successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useRevokeGatePass(residencyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (passId: string) => {
      if (!residencyId) throw new Error("Residency ID is required");
      return residentService.revokeGatePass(residencyId, passId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", residencyId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "dashboard", residencyId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "visitors", residencyId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "gate-passes"] });
      toast.success("Gate pass revoked successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useVisitors(
  residencyId: string | null,
  params: {
    page: number;
    pageSize: number;
    search?: string;
    sort?: string;
    filters?: string
  }
) {
  return useQuery({
    queryKey: ["resident", "visitors", residencyId, params],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required");
      const response = await residentService.getVisitors(
        residencyId,
        params
      );
      return response.data;
    },
    enabled: !!residencyId,
  });
}

export function useVisitorsByGatePass(residencyId: string | null, gatePassId: string | null) {
  return useQuery({
    queryKey: ["resident", "visitors", residencyId, "gate-pass", gatePassId],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required");
      if (!gatePassId) throw new Error("Gate pass ID is required");
      const response = await residentService.getVisitorsByGatePass(residencyId, gatePassId);
      return response.data;
    },
    enabled: !!residencyId && !!gatePassId,
  });
}

export function useVisitor(
  residencyId: string | null,
  visitorId: string | null
) {
  return useQuery({
    queryKey: ["resident", "visitor", residencyId, visitorId],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required");
      if (!visitorId) throw new Error("Visitor ID is required");
      const response = await residentService.getVisitor(residencyId, visitorId);
      return response.data;
    },
    enabled: !!residencyId && !!visitorId,
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

export function useResidencyDues(
  residencyId: string | null,
  params: {
    page: number;
    pageSize: number;
    search?: string;
    sort?: string;
    filters?: string
  }
) {
  return useQuery<PaginatedResponse<ResidencyDue>>({
    queryKey: ["resident", "residency-dues", residencyId, params],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required");
      const response = await residentService.getResidencyDues(residencyId, params);
      return response.data;
    },
    enabled: !!residencyId,
  });
}

export function useResidencyDue(residencyId: string | null, dueId: string | null) {
  return useQuery({
    queryKey: ["resident", "residency-due", residencyId, dueId],
    queryFn: async () => {
      if (!dueId) throw new Error("Due ID is required");
      if (!residencyId) throw new Error("Residency ID is required");
      const response = await residentService.getResidencyDue(residencyId, dueId);
      return response.data;
    },
    enabled: !!dueId && !!residencyId,
  });
}

export function useScheduleResidencyDue(residencyId: string | null, dueId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { payment_breakdown: string }) => {
      if (!dueId || !residencyId) throw new Error("Due ID and Residency ID are required");
      return residentService.scheduleResidencyDue(residencyId, dueId, data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "residency-due", residencyId, dueId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "residency-dues", residencyId] });
      toast.success("Payment schedule updated successfully!");
      return response.data;
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useDueSchedules(
  residencyId: string | null,
  dueId: string | null,
  page: number = 1,
  pageSize: number = 10,
  filters?: string
) {
  return useQuery({
    queryKey: ["resident", "due-schedules", residencyId, dueId, page, pageSize, filters],
    queryFn: async () => {
      if (!residencyId || !dueId) throw new Error("Residency and Due ID are required");
      const response = await residentService.getDueSchedules(residencyId, dueId, page, pageSize, filters);
      return response.data;
    },
    enabled: !!residencyId && !!dueId,
  });
}

export function useDuePayments(
  residencyId: string | null,
  dueId: string | null,
  page: number = 1,
  pageSize: number = 10,
  filters?: string
) {
  return useQuery({
    queryKey: ["resident", "due-payments", residencyId, dueId, page, pageSize, filters],
    queryFn: async () => {
      if (!residencyId || !dueId) throw new Error("Residency and Due ID are required");
      const response = await residentService.getDuePayments(residencyId, dueId, page, pageSize, filters);
      return response.data;
    },
    enabled: !!residencyId && !!dueId,
  });
}

export function usePayDueSchedule(residencyId: string | null, dueId: string | null) {
  return useMutation({
    mutationFn: (scheduleId: string) => {
      if (!residencyId || !dueId) throw new Error("Residency and Due ID are required");
      return residentService.payDueSchedule(residencyId, dueId, scheduleId);
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

export function useAddVisitorsToGatePass(residencyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passId, data }: { passId: string; data: { name: string; email: string; phone?: string }[] }) => {
      if (!residencyId) throw new Error("Residency ID is required");
      return residentService.addVisitorsToGatePass(residencyId, passId, data);
    },
    onSuccess: (_, { passId }) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-pass", residencyId, passId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", residencyId] });
      // Invalidate specific visitor queries if necessary
      toast.success("Visitors added successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useRemoveVisitorFromGatePass(residencyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passId, visitorIds }: { passId: string; visitorIds: string[] }) => {
      if (!residencyId) throw new Error("Residency ID is required");
      return residentService.removeVisitorFromGatePass(residencyId, passId, visitorIds);
    },
    onSuccess: (_, { passId }) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-pass", residencyId, passId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", residencyId] });
      toast.success("Visitor removed successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useUploadVisitorsToGatePass(residencyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passId, data }: { passId: string; data: FormData }) => {
      if (!residencyId) throw new Error("Residency ID is required");
      return residentService.uploadVisitorsToGatePass(residencyId, passId, data);
    },
    onSuccess: (_, { passId }) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-pass", residencyId, passId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", residencyId] });
      toast.success("Visitors uploaded successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useExtendGatePass(residencyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passId, validTo }: { passId: string; validTo: string }) => {
      if (!residencyId) throw new Error("Residency ID is required");
      return residentService.extendGatePass(residencyId, passId, { valid_to: validTo });
    },
    onSuccess: (_, { passId }) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-pass", residencyId, passId] });
      queryClient.invalidateQueries({ queryKey: ["resident", "gate-passes", residencyId] });
      toast.success("Gate pass extended successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });

 
}

 export function useResidentApproveVisitRequest() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({  visitRequestId, data }: {visitRequestId: string; data: CreateGatePassData }) => {
        return residentService.approveVisitRequest(visitRequestId, data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["resident", "dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["resident", "visitors"] });
        toast.success("Visit request approved and gate pass created successfully!");
      },
      onError: (error: any) => {
        toast.error(parseApiError(error).message);
      },
    });
  }

  export function useResidentDeclineVisitRequest() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({  visitRequestId, reason }: { visitRequestId: string; reason?: string }) => {
        return residentService.declineVisitRequest( visitRequestId, reason);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["resident", "dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["resident", "visitors"] });
        toast.success("Visit request declined successfully!");
      },
      onError: (error: any) => {
        toast.error(parseApiError(error).message);
      },
    });
  }

  export function useResidentVisitRequests(
    params: {
      page: number;
      pageSize: number;
      search?: string;
      sort?: string | null;
      filters?: string;
    }
  ) {
    return useQuery<PaginatedResponse<VisitResponse>>({
      queryKey: ["resident", "visitRequests", params],
      queryFn: async () => {
        const response = await residentService.getVisitRequests( {
          ...params,
          sort: params.sort || undefined,
        });
        return response.data;
      },
    });
  }


  export function useResidentVisitRequest(
    visitRequestId: string | null
  ) {
    return useQuery<VisitResponse>({
      queryKey: ["resident", "visit-request", visitRequestId],
      queryFn: async () => {
        if (!visitRequestId) throw new Error("Visit Request ID is required");
        const response = await residentService.getVisitRequest(visitRequestId);
        return response.data;
      },
      enabled: !!visitRequestId,
    });
  }

