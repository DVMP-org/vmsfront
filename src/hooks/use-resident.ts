import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { residentService } from "@/services/resident-service";
import {
  CreateGatePassRequest,
  GatePass,
  PaginatedResponse,
  ResidentUserCreate,
} from "@/types";
import { toast } from "sonner";

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
      toast.error(error.response?.data?.detail || "Failed to create gate pass");
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
      toast.success("Gate pass revoked successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to revoke gate pass");
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
      toast.error(
        error.response?.data?.detail || "Failed to complete onboarding"
      );
    },
  });
}
