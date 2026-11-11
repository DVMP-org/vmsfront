import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export type MaintenanceDomain =
  "residential" | "commercial" | "hospitality" | "mixed_use";

export interface MaintenanceRequest {
  id: string;
  site_id: string;
  place: { id: string; name: string };
  domain: MaintenanceDomain;
  request_type: "request" | "work_order" | "inspection" | "preventive";
  category: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status:
    | "open"
    | "triaged"
    | "assigned"
    | "pending_approval"
    | "in_progress"
    | "resolved"
    | "closed";
  assigned_to?: { id: string; display_name: string } | null;
  reported_by?: { id: string; display_name: string } | null;
  created_by_site_admin?: {
    id: string;
    user_id: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
  contractor?: { id: string; display_name: string } | null;
  approval_status: "not_required" | "pending" | "approved" | "rejected";
  scheduled_for?: string | null;
  due_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  resolution_notes?: string | null;
  cost_estimate?: string | null;
  actual_cost?: string | null;
  currency: string;
  requires_access_authorization: boolean;
  affects_room_availability: boolean;
  expense_allocation_required: boolean;
  created_at: string;
  updated_at: string;
  activities: Array<{
    id: string;
    event_type: string;
    message?: string | null;
    actor?: { id: string; display_name: string } | null;
    actor_site_admin?: {
      id: string;
      user_id: string;
      display_name: string;
      email: string;
    } | null;
    occurred_at: string;
  }>;
}

export interface MaintenanceCreateInput {
  site_id: string;
  place_id: string;
  domain: MaintenanceDomain;
  request_type: MaintenanceRequest["request_type"];
  category: string;
  title: string;
  description: string;
  priority: MaintenanceRequest["priority"];
  assigned_to_party_id?: string;
  due_at?: string;
  scheduled_for?: string;
  cost_estimate?: string;
  currency?: string;
  requires_access_authorization?: boolean;
  affects_room_availability?: boolean;
  expense_allocation_required?: boolean;
}

export type MaintenanceUpdateInput = Partial<
  Pick<
    MaintenanceRequest,
    | "status"
    | "priority"
    | "category"
    | "scheduled_for"
    | "due_at"
    | "resolution_notes"
    | "cost_estimate"
    | "actual_cost"
  >
> & {
  assigned_to_party_id?: string | null;
  contractor_party_id?: string | null;
  approval_status?: "not_required" | "pending" | "approved" | "rejected";
  comment?: string;
};

export const maintenanceApi = {
  list: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    domain?: MaintenanceDomain;
    status?: string;
    priority?: string;
    category?: string;
    place_id?: string;
  }) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<MaintenanceRequest>>>(
        "/admin/maintenance",
        { params: { page: 1, page_size: 100, ...params } },
      )
    ).data,
  get: async (id: string) =>
    (
      await apiClient.get<ApiResponse<MaintenanceRequest>>(
        `/admin/maintenance/${id}`,
      )
    ).data,
  create: async (body: MaintenanceCreateInput) =>
    (
      await apiClient.post<ApiResponse<MaintenanceRequest>>(
        "/admin/maintenance",
        body,
      )
    ).data,
  update: async (id: string, body: MaintenanceUpdateInput) =>
    (
      await apiClient.patch<ApiResponse<MaintenanceRequest>>(
        `/admin/maintenance/${id}`,
        body,
      )
    ).data,
};
