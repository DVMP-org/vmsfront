import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
import { adminGateService } from "@/services/admin-gate-service";
import { Gate, CreateGateRequest, UpdateGateRequest } from "@/types/gate";
import {
  CreateHouseRequest,
  CreateAdminRequest,
  GatePass,
  GatePassCheckinRequest,
  GateEvent,
  ResidentUser,
  ResidentUserCreate,
  PaginatedResponse,
  House,
  HouseGroup,
  CreateHouseGroupRequest,
  UpdateHouseGroupRequest,
  Admin,
  HouseDetail,
  Resident,
  ResidentHouse,
  Due,
  CreateDueRequest,
  HouseDue,
  DueSchedule,
  DuePayment,
  AdminRole,
  Visitor,
} from "@/types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";
import { AdminDashboard } from "@/types";

// Houses
export function useAdminHouses(params: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: string;
  sort?: string;
}) {
  return useQuery<PaginatedResponse<House>>({
    queryKey: ["admin", "houses", params],
    queryFn: async () => {
      const response = await adminService.getHouses(params);
      return response.data;
    },
  });
}

export function useAdminHouse(houseId: string | null) {
  return useQuery<House>({
    queryKey: ["admin", "house", houseId],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await adminService.getHouse(houseId);
      return response.data;
    },
    enabled: !!houseId,
  });
}

export function useAdminHouseResidents(houseId: string | null) {
  return useQuery<ResidentHouse[]>({
    queryKey: ["admin", "house", houseId, "residents"],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await adminService.getHouseResidents(houseId);
      return response.data;
    },
    enabled: !!houseId,
  });
}

export function useCreateHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; address: string }) =>
      adminService.createHouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "houses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("House created successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useUpdateHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ houseId, data }: {
      houseId: string;
      data: { name?: string; description?: string; address?: string; house_group_id?: string };
    }) => adminService.updateHouse(houseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "houses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("House updated successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useDeleteHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (houseId: string) => adminService.deleteHouse(houseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "houses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("House deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useBulkDeleteHouses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (houseIds: string[]) => adminService.bulkDeleteHouses(houseIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "houses"] });
      toast.success("Houses deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useBulkToggleHouseActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (houseIds: string[]) => adminService.bulkToggleHouseActive(houseIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "houses"] });
      toast.success("Houses status updated successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

// Residents
export function useAdminResidents(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  filters?: string;
  sort?: string;
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
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Resident created successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useAdminResident(residentId: string | null) {
  return useQuery<Resident>({
    queryKey: ["admin", "resident", residentId],
    queryFn: async () => {
      if (!residentId) throw new Error("Resident ID is required");
      const response = await adminService.getResident(residentId);
      return response.data;
    },
    enabled: !!residentId,
  });
}

export function useAdminResidentHouses(residentId: string | null) {
  return useQuery<ResidentHouse[]>({
    queryKey: ["admin", "resident", residentId, "houses"],
    queryFn: async () => {
      if (!residentId) throw new Error("Resident ID is required");
      const response = await adminService.getResidentHouses(residentId);
      return response.data;
    },
    enabled: !!residentId,
  });
}

export function useUpdateResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: any; // Using any to match component usage, or ResidentProfileUpdatePayload
    }) => adminService.updateResident(residentId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "residents"] });
      // Also invalidate single resident query if it exists
      if (response.data?.resident?.id) {
        queryClient.invalidateQueries({ queryKey: ["admin", "resident", response.data.resident.id] });
      }
      toast.success("Resident updated successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useDeleteResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (residentId: string) => adminService.deleteResident(residentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "residents"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Resident deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

// Admins
export function useAdmins(params: {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  filters?: string;
}) {
  return useQuery<PaginatedResponse<Admin>>({
    queryKey: ["admin", "admins", params],
    queryFn: async () => {
      const response = await adminService.getAdmins(params);
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
      toast.error(parseApiError(error).message);
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
      toast.error(parseApiError(error).message);
    },
  });
}

export function useAdminDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => adminService.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      data,
    }: {
      roleId: string;
      data: Partial<{
        name: string;
        code: string;
        description: string;
        permissions: any;
      }>;
    }) => adminService.updateRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role updated successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
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
      toast.error(parseApiError(error).message);
    },
  });
}

// Roles
export function useAdminRoles(params: {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  filters?: string;
}) {
  return useQuery<PaginatedResponse<AdminRole>>({
    queryKey: ["admin", "roles", params],
    queryFn: async () => {
      const response = await adminService.getRoles(params);
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
      toast.error(parseApiError(error).message);
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
      toast.error(parseApiError(error).message);
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

export function useAdminVisitors(params: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: string;
  sort?: string;
}) {
  return useQuery<PaginatedResponse<Visitor>>({
    queryKey: ["admin", "visitors", params],
    queryFn: async () => {
      const response = await adminService.getVisitors(params);
      return response.data;
    },
  });
}

export function useAdminVisitor(visitorId: string | null) {
  return useQuery<Visitor>({
    queryKey: ["admin", "visitor", visitorId],
    queryFn: async () => {
      if (!visitorId) throw new Error("Visitor ID is required");
      const response = await adminService.getVisitor(visitorId);
      return response.data;
    },
    enabled: !!visitorId,
  });
}


export function useAdminGatePasses(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  filters?: string;
  sort?: string;
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
  search?: string;
  filters?: string;
  sort?: string;
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
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Role created successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
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
      toast.error(parseApiError(error).message);
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
      toast.error(parseApiError(error).message);
    },
  });
}

// House Groups
export function useAdminHouseGroups(params: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: string;
  sort?: string;
}) {
  return useQuery<PaginatedResponse<HouseGroup>>({
    queryKey: ["admin", "house-groups", params],
    queryFn: async () => {
      const response = await adminService.getHouseGroups(params);
      return response.data;
    },
  });
}


export function useAdminHouseGroup(groupId: string | null) {
  return useQuery<HouseGroup>({
    queryKey: ["admin", "house-group", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("House group ID is required");
      const response = await adminService.getHouseGroup(groupId);
      return response.data;
    },
    enabled: !!groupId,
  });
}

export function useCreateHouseGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHouseGroupRequest) =>
      adminService.createHouseGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "house-groups"] });
      toast.success("House group created successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useUpdateHouseGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: UpdateHouseGroupRequest;
    }) => adminService.updateHouseGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "house-groups"] });
      toast.success("House group updated successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useDeleteHouseGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => adminService.deleteHouseGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "house-groups"] });
      toast.success("House group deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useBulkDeleteHouseGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupIds: string[]) => adminService.bulkDeleteHouseGroups(groupIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "house-groups"] });
      toast.success("House groups deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useToggleHouseGroupActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => adminService.toggleHouseGroupActive(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "house-groups"] });
      toast.success("House group status updated successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useBulkToggleHouseGroupActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupIds: string[]) => adminService.bulkToggleHouseGroupActive(groupIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "house-groups"] });
      toast.success("House groups status updated successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

// Dues
export function useAdminDues(params: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: string;
  sort?: string;
}) {
  return useQuery<PaginatedResponse<Due>>({
    queryKey: ["admin", "dues", params],
    queryFn: async () => {
      const response = await adminService.getDues(params);
      return response.data;
    },
  });
}

export function useCreateDue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDueRequest) => adminService.createDue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dues"] });
      toast.success("Due created successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useAdminDue(dueId: string | null) {
  return useQuery<Due>({
    queryKey: ["admin", "due", dueId],
    queryFn: async () => {
      if (!dueId) throw new Error("Due ID is required");
      const response = await adminService.getDue(dueId);
      return response.data;
    },
    enabled: !!dueId,
  });
}

export function useUpdateDue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dueId, data }: { dueId: string; data: Partial<CreateDueRequest> }) =>
      adminService.updateDue(dueId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dues"] });
      if (response.data?.id) {
        queryClient.invalidateQueries({ queryKey: ["admin", "due", response.data.id] });
      }
      toast.success("Due updated successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useDeleteDue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dueId: string) => adminService.deleteDue(dueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dues"] });
      toast.success("Due deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

// Gates
export function useAdminGates(params: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: string;
  sort?: string;
}) {
  return useQuery<PaginatedResponse<Gate>>({
    queryKey: ["admin", "gates", params],
    queryFn: async () => {
      const response = await adminGateService.getGates(params);
      return response.data;
    },
  });
}

export function useAdminGate(gateId: string | null) {
  return useQuery<Gate>({
    queryKey: ["admin", "gate", gateId],
    queryFn: async () => {
      if (!gateId) throw new Error("Gate ID is required");
      const response = await adminGateService.getGate(gateId);
      return response.data;
    },
    enabled: !!gateId,
  });
}

export function useCreateGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGateRequest) => adminGateService.createGate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gates"] });
      toast.success("Gate created successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useUpdateGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gateId, data }: { gateId: string; data: UpdateGateRequest }) =>
      adminGateService.updateGate(gateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gates"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "gate"] });
      toast.success("Gate updated successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useDeleteGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gateId: string) => adminGateService.deleteGate(gateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gates"] });
      toast.success("Gate deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useToggleGateAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gateId, gateAdminIds }: { gateId: string; gateAdminIds: string[] }) =>
      adminGateService.toggleGateAdminStatus(gateId, gateAdminIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gates"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "gate"] });
      toast.success("Admin status toggled!");
    },
    onError: (error: any) => {
      toast.error(parseApiError(error).message);
    },
  });
}



export function useAdminDueHouses(dueId: string | null, params: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  return useQuery<PaginatedResponse<HouseDue>>({
    queryKey: ["admin", "due-houses", dueId, params],
    queryFn: async () => {
      if (!dueId) throw new Error("Due ID is required");
      const response = await adminService.getDueHouses(dueId, params);
      return response.data;
    },
    enabled: !!dueId,
  });
}

export function useAdminHouseDue(dueId: string | null, houseId: string | null) {
  return useQuery<HouseDue>({
    queryKey: ["admin", "house-due", dueId, houseId],
    queryFn: async () => {
      if (!dueId || !houseId) throw new Error("Due ID and House ID are required");
      const response = await adminService.getHouseDue(dueId, houseId);
      return response.data;
    },
    enabled: !!dueId && !!houseId,
  });
}

export function useAdminDueSchedules(
  dueId: string | null,
  houseId: string | null,
  page: number = 1,
  pageSize: number = 10,
  filters?: string,
  sorts?: string
) {
  return useQuery({
    queryKey: ["admin", "due-schedules", dueId, houseId, page, pageSize, filters, sorts],
    queryFn: async () => {
      if (!dueId || !houseId) throw new Error("Due and House ID are required");
      const response = await adminService.getDueSchedules(
        dueId,
        houseId,
        page,
        pageSize,
        filters,
        sorts
      );
      return response.data;
    },
    enabled: !!dueId && !!houseId,
  });
}

export function useAdminDuePayments(
  dueId: string | null,
  houseId: string | null,
  page: number = 1,
  pageSize: number = 10,
  filters?: string,
  sorts?: string
) {
  return useQuery({
    queryKey: ["admin", "due-payments", dueId, houseId, page, pageSize, filters, sorts],
    queryFn: async () => {
      if (!dueId || !houseId) throw new Error("Due and House ID are required");
      const response = await adminService.getDuePayments(dueId, houseId, page, pageSize, filters, sorts);
      return response.data;
    },
    enabled: !!dueId && !!houseId,
  });
}

export function useAdminProfile() {
  const queryClient = useQueryClient();
  const STORAGE_KEY = "vms_admin_profile";

  return useQuery<Admin>({
    queryKey: ["admin", "profile"],
    queryFn: async () => {
      const response = await adminService.getAdminProfile();
      const profile = response.data;
      // Persistence: store in localStorage for instant access next time
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch (e) {
          console.error(e);
        }
      }
      return profile;
    },
    initialData: () => {
      // Synchronous recovery from localStorage for instant Sidebar rendering
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            return undefined;
          }
        }
      }
      return undefined;
    },
    staleTime: 10 * 60 * 1000, // Keep fresh for 10 mins (was 5)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 mins
  });
}

// Transactions
export function useAdminTransactions(params: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ["admin", "transactions", params],
    queryFn: async () => {
      const response = await adminService.getTransactions(params);
      return response.data;
    },
  });
}

export function useAdminTransaction(transactionId: string | null) {
  return useQuery({
    queryKey: ["admin", "transaction", transactionId],
    queryFn: async () => {
      if (!transactionId) throw new Error("Transaction ID is required");
      const response = await adminService.getTransaction(transactionId);
      return response.data;
    },
    enabled: !!transactionId,
  });
}

// Prefetching hooks for performance
export function usePrefetchHouse() {
  const queryClient = useQueryClient();

  return (houseId: string) => {
    if (!houseId) return;
    queryClient.prefetchQuery({
      queryKey: ["admin", "house", houseId],
      queryFn: async () => {
        const response = await adminService.getHouse(houseId);
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

export function usePrefetchResident() {
  const queryClient = useQueryClient();

  return (residentId: string) => {
    if (!residentId) return;
    queryClient.prefetchQuery({
      queryKey: ["admin", "resident", residentId],
      queryFn: async () => {
        const response = await adminService.getResident(residentId);
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

export function useAdminGateDependencyMap() {
  return useQuery({
    queryKey: ["admin", "gate", "dependency-map"],
    queryFn: async () => {
      const response = await adminGateService.getGateDependencyMap();
      return response.data;
    },
  });
}
