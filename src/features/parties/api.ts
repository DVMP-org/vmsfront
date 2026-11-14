"use client";

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type PartyKind = "person" | "organization";

export interface PartySummary {
  id: string;
  organization_id?: string;
  kind: PartyKind;
  display_name: string;
  email: string | null;
  phone?: string | null;
  is_active: boolean;
}

export interface PartyInput {
  kind: PartyKind;
  display_name: string;
  email?: string | null;
  phone?: string | null;
}

/** Organization-wide Party register. Identity lives here, not in a Place. */
export const partiesApi = {
  create: async (body: PartyInput) =>
    (
      await apiClient.post<ApiResponse<PartySummary>>("/admin/parties", body)
    ).data,
};
