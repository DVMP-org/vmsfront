import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
import {
  CreateHouseRequest,
  CreateAdminRequest,
  GatePass,
  GatePassCheckinRequest,
  GateEvent,
  ResidentUser,
  ResidentUserCreate,
  ImportResponse,
  PaginatedResponse,
  House,
} from "@/types";
import { toast } from "sonner";
import { AdminDashboard } from "@/types";

// Houses
export function useAdminHouses(params: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  return useQuery<PaginatedResponse<House>>({
    queryKey: ["admin", "houses", params],
    queryFn: async () => {
      const response = await adminService.getHouses(params);
      return response.data;
    },
  });
}

export function useCreateHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHouseRequest) => adminService.createHouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "houses"] });
      toast.success("House created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create house");
    },
  });
}

// Residents
export function useAdminResidents(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}) {
  return useQuery<PaginatedResponse<ResidentUser>>({
    queryKey: ["admin", "residents", params],
    queryFn: async () => {
      const response = await adminService.getResidents(params);
      return response.data;
    },
  });
}

export function useCreateResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResidentUserCreate) =>
      adminService.createResident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "residents"] });
      toast.success("Resident created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create resident");
    },
  });
}

// Admins
export function useAdmins() {
  return useQuery({
    queryKey: ["admin", "admins"],
    queryFn: async () => {
      const response = await adminService.getAdmins();
      return response.data;
    },
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminRequest) => adminService.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      toast.success("Admin created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create admin");
    },
  });
}

export function useUpdateAdminRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, roleId }: { adminId: string; roleId: string }) =>
      adminService.updateAdminRole(adminId, { role_id: roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      toast.success("Admin role updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update admin role");
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId: string) => adminService.deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      toast.success("Admin deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete admin");
    },
  });
}

// Roles
export function useAdminRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const response = await adminService.getRoles();
      return response.data;
    },
  });
}

export function useAdminRole(roleId: string | null) {
  return useQuery({
    queryKey: ["admin", "role", roleId],
    queryFn: async () => {
      if (!roleId) throw new Error("Role ID is required");
      const response = await adminService.getRole(roleId);
      return response.data;
    },
    enabled: !!roleId,
  });
}

// Gate Operations
export function useCheckinPass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GatePassCheckinRequest) =>
      adminService.checkinPass(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gate-events"] });
      toast.success(response.data.message || "Check-in successful!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Check-in failed");
    },
  });
}

export function useCheckoutPass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GatePassCheckinRequest) =>
      adminService.checkoutPass(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gate-events"] });
      toast.success(response.data.message || "Check-out successful!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Check-out failed");
    },
  });
}

// Get visitors by pass code
export function useVisitorsByPassCode(passCode: string | null) {
  return useQuery({
    queryKey: ["admin", "visitors", passCode],
    queryFn: async () => {
      if (!passCode) throw new Error("Pass code is required");
      const response = await adminService.getVisitorsByPassCode(passCode);
      return response.data;
    },
    enabled: !!passCode,
  });
}

export function useAdminGatePasses(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}) {
  return useQuery<PaginatedResponse<GatePass>>({
    queryKey: ["admin", "gate-passes", params],
    queryFn: async () => {
      const response = await adminService.getGatePasses(params);
      return response.data;
    },
  });
}

export function useAdminGatePass(passId: string | null) {
  return useQuery<GatePass>({
    queryKey: ["admin", "gate-pass", passId],
    queryFn: async () => {
      if (!passId) throw new Error("Gate pass ID is required");
      const response = await adminService.getGatePass(passId);
      return response.data;
    },
    enabled: !!passId,
  });
}

export function useAdminGateEvents(params: {
  page: number;
  pageSize: number;
  passId?: string;
  houseId?: string;
}) {
  return useQuery<PaginatedResponse<GateEvent>>({
    queryKey: ["admin", "gate-events", params],
    queryFn: async () => {
      const response = await adminService.getGateEvents(params);
      return response.data;
    },
  });
}

export function useAdminGateEvent(eventId: string | null) {
  return useQuery<GateEvent>({
    queryKey: ["admin", "gate-event", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const response = await adminService.getGateEvent(eventId);
      return response.data;
    },
    enabled: !!eventId,
  });
}

export function useAdminGatePassEvents(
  passId: string | null,
  params: { page: number; pageSize: number }
) {
  return useQuery<GateEvent[]>({
    queryKey: ["admin", "gate-pass-events", passId, params],
    queryFn: async () => {
      if (!passId) throw new Error("Pass ID is required");
      const response = await adminService.getGatePassEvents(passId, params);
      return response.data;
    },
    enabled: !!passId,
  });
}

// Dashboard
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const response = await adminService.getDashboard();
      return response.data;
    },
  });
}

export function useAdminAnalyticsSummary() {
  return useQuery({
    queryKey: ["admin", "analytics-summary"],
    queryFn: async () => {
      const response = await adminService.getAnalyticsSummary();
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useAdminPermissions() {
  return useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: async () => {
      const response = await adminService.getAllPermissions();
      return response.data.permissions;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      code: string;
      description?: string;
      permissions: string[] | Record<string, string[]> | string;
    }) => adminService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create role");
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await adminService.getUsers();
      return response.data;
    },
  });
}

export function useImportHouses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => adminService.importHouses(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "houses"] });
      toast.success(
        `Imported ${response.data.successful} of ${response.data.total} houses`
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Failed to import houses"
      );
    },
  });
}

export function useImportResidents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => adminService.importResidents(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "residents"] });
      toast.success(
        `Imported ${response.data.successful} of ${response.data.total} residents`
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Failed to import residents"
      );
    },
  });
}
