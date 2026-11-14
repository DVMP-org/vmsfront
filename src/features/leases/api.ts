import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export type LeaseStatus =
  | "draft"
  | "pending_signature"
  | "active"
  | "expiring"
  | "terminated"
  | "expired"
  | "cancelled";

export type LeaseKind = "lease" | "tenancy" | "licence" | "stay";

export type ChargeRecurrence =
  | "one_time"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "biannual"
  | "yearly";

/** One planned charge on a lease. It becomes a real charge on activation. */
export interface LeaseChargeLine {
  id: string;
  name: string;
  amount: string;
  currency: string;
  recurrence: ChargeRecurrence;
  first_due_date: string | null;
  create_definition: boolean;
  charge_definition_id: string | null;
  charge_assignment_id: string | null;
  status: "planned" | "applied" | "cancelled";
  created_at: string;
}

export interface Lease {
  id: string;
  organization_id: string;
  site_id: string;
  place_id: string;
  party_id: string;
  reference: string | null;
  kind: LeaseKind;
  status: LeaseStatus;
  starts_at: string;
  ends_at: string | null;
  rent_amount: string | null;
  currency: string;
  rent_cadence: ChargeRecurrence | null;
  deposit_amount: string | null;
  deposit_held: string;
  notice_days: number;
  notes: string | null;
  signed_at: string | null;
  terminated_on: string | null;
  termination_reason: string | null;
  renewed_from_id: string | null;
  created_at: string;
  updated_at: string;
  place_name: string | null;
  party_name: string | null;
  charge_lines: LeaseChargeLine[];
}

export interface LeaseChargeLineInput {
  name: string;
  amount: string;
  currency?: string;
  recurrence: ChargeRecurrence;
  first_due_date?: string | null;
  create_definition: boolean;
}

export interface LeaseInput {
  place_id: string;
  party_id: string;
  kind: LeaseKind;
  reference?: string | null;
  starts_at: string;
  ends_at?: string | null;
  rent_amount?: string | null;
  currency: string;
  rent_cadence?: ChargeRecurrence | null;
  deposit_amount?: string | null;
  notice_days: number;
  notes?: string | null;
  charge_lines: LeaseChargeLineInput[];
}

export type LeaseUpdateInput = Partial<Omit<LeaseInput, "place_id" | "party_id">>;

export interface LeasePlanLine {
  name: string;
  amount: string;
  currency: string;
  recurrence: ChargeRecurrence;
  definition_id: string | null;
  creates_definition: boolean;
  existing_definition_id: string | null;
  schedule_count: number;
  first_due_date: string;
  last_due_date: string;
  status: string;
}

/** What confirming the lease would create, computed before anything is written. */
export interface LeasePlanPreview {
  lease_id: string;
  status: LeaseStatus;
  starts_at: string;
  ends_at: string | null;
  lines: LeasePlanLine[];
  creates_assignments: boolean;
}

export interface LeaseTerminateInput {
  terminated_on?: string | null;
  reason?: string | null;
  end_charges: boolean;
}

const base = "/admin/leases";

export const leasesApi = {
  list: async (
    params: {
      status?: string;
      search?: string;
      place_id?: string;
      party_id?: string;
      page?: number;
      page_size?: number;
    } = {},
  ) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Lease>>>(base, {
        params: { page: 1, page_size: 100, ...params },
      })
    ).data,
  get: async (id: string) =>
    (await apiClient.get<ApiResponse<Lease>>(`${base}/${id}`)).data,
  create: async (body: LeaseInput) =>
    (await apiClient.post<ApiResponse<Lease>>(base, body)).data,
  update: async (id: string, body: LeaseUpdateInput) =>
    (await apiClient.patch<ApiResponse<Lease>>(`${base}/${id}`, body)).data,
  plan: async (id: string) =>
    (await apiClient.get<ApiResponse<LeasePlanPreview>>(`${base}/${id}/plan`))
      .data,
  activate: async (id: string) =>
    (await apiClient.post<ApiResponse<Lease>>(`${base}/${id}/activate`, {})).data,
  terminate: async (id: string, body: LeaseTerminateInput) =>
    (await apiClient.post<ApiResponse<Lease>>(`${base}/${id}/terminate`, body))
      .data,
};
