import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export type ContractorStatus =
  | "invited"
  | "active"
  | "suspended"
  | "expired"
  | "revoked";

/** A contractor registered against the selected Site. */
export interface Contractor {
  id: string;
  organization_id: string;
  site_id: string;
  contact_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  purpose: string | null;
  status: ContractorStatus;
  requires_permit: boolean;
  permit_reference: string | null;
  permit_expires_at: string | null;
  access_from: string;
  access_to: string;
  notes: string | null;
  invited_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractorInput {
  contact_name: string;
  email: string;
  company_name?: string | null;
  phone?: string | null;
  purpose?: string | null;
  requires_permit: boolean;
  permit_reference?: string | null;
  permit_expires_at?: string | null;
  access_from: string;
  access_to: string;
  notes?: string | null;
}

export type ContractorUpdateInput = Partial<
  Omit<ContractorInput, "access_from" | "access_to">
> & {
  access_from?: string;
  access_to?: string;
  status?: ContractorStatus;
};

const base = "/admin/contractors";

export const contractorsApi = {
  list: async (params: { status?: string; search?: string } = {}) =>
    (
      await apiClient.get<ApiResponse<PaginatedResponse<Contractor>>>(base, {
        params: { page: 1, page_size: 100, ...params },
      })
    ).data,
  create: async (body: ContractorInput) =>
    (await apiClient.post<ApiResponse<Contractor>>(base, body)).data,
  update: async (id: string, body: ContractorUpdateInput) =>
    (await apiClient.patch<ApiResponse<Contractor>>(`${base}/${id}`, body)).data,
  revoke: async (id: string) =>
    (await apiClient.post<ApiResponse<Contractor>>(`${base}/${id}/revoke`, {}))
      .data,
};
