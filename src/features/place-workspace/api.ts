import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  WorkspaceParty,
  WorkspacePlace,
  WorkspaceRelationship,
} from "@/types";
export interface PlaceContext {
  place: WorkspacePlace;
  party: WorkspaceParty;
  relationships: WorkspaceRelationship[];
  is_place_admin: boolean;
  effective_use_case:
    "residential" | "commercial" | "hospitality" | "mixed_use";
  modules: string[];
  maintenance_categories: string[];
  site_id: string;
}
export interface Announcement {
  id: string;
  title: string;
  body: string;
  /** low | normal | high | urgent — drives the dashboard alert badge. */
  priority?: string;
  published_at: string;
  is_pinned: boolean;
}
export interface PersonalMaintenance {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}
export interface PlaceCharge {
  id: string;
  title: string;
  /** Definition this charge was billed from, used to group the ledger. */
  definition_id?: string;
  due_date: string;
  amount: string;
  balance: string;
  currency: string;
  status: string;
  can_pay: boolean;
  /** Assignment the schedule belongs to, needed to acknowledge a cadence. */
  assignment_id?: string;
  /** Baseline billing rhythm of the charge definition. */
  recurrence?: string;
  is_recurring?: boolean;
  /** Fees priced flexibly let the payer acknowledge a coarser cadence. */
  is_flexible?: boolean;
  acknowledged_cadence?: string | null;
  acknowledged_at?: string | null;
  responsible_party_id?: string | null;
}
/** One row per charge definition billed at a Place, with ledger totals. */
export interface PlaceChargeDefinition {
  definition_id: string;
  title: string;
  recurrence: string;
  is_recurring: boolean;
  is_flexible: boolean;
  amount: string;
  currency: string;
  schedule_count: number;
  open_count: number;
  outstanding: string | number;
  paid: string | number;
  next_due_date?: string | null;
  last_due_date?: string | null;
  can_pay: boolean;
  acknowledged_cadence?: string | null;
  status: "outstanding" | "paid" | "awaiting_acknowledgement" | string;
}
export interface ChargeAcknowledgement {
  id: string;
  charge_assignment_id: string;
  party_id: string;
  cadence: string;
  baseline_cadence: string;
  note: string | null;
  acknowledged_at: string;
}
export interface Movement {
  id: string;
  gate_name: string;
  /** Destination Place for the movement (invitation destination fallback). */
  place_name?: string | null;
  direction: string;
  outcome: string;
  reason_code: string;
  subject_type: string;
  occurred_at: string;
  /** Name of the person the event belongs to, when known. */
  person_name?: string | null;
  credential_type?: string | null;
  credential_reference?: string | null;
  /** Groups a person's events into one journey. */
  subject_key?: string | null;
  invitation_code?: string | null;
  guest_suffix?: string | null;
}
export interface MaintenanceInput {
  title: string;
  description: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
}
const path = (id: string) => `/workspace/places/${encodeURIComponent(id)}`;
export const placeWorkspaceApi = {
  context: async (id: string) =>
    (await apiClient.get<ApiResponse<PlaceContext>>(`${path(id)}/context`))
      .data,
  announcements: async (id: string) =>
    (
      await apiClient.get<ApiResponse<Announcement[]>>(
        `${path(id)}/announcements`,
      )
    ).data,
  maintenance: async (id: string, page = 1) =>
    (
      await apiClient.get<
        ApiResponse<{
          items: PersonalMaintenance[];
          total: number;
          page: number;
          page_size: number;
        }>
      >(`${path(id)}/maintenance`, { params: { page, page_size: 20 } })
    ).data,
  requestMaintenance: async (id: string, body: MaintenanceInput) =>
    (
      await apiClient.post<ApiResponse<{ id: string }>>(
        `${path(id)}/maintenance`,
        body,
      )
    ).data,
  movements: async (
    id: string,
    page = 1,
    subjectKey?: string,
    pageSize = 20,
  ) =>
    (
      await apiClient.get<
        ApiResponse<{ items: Movement[]; has_more: boolean }>
      >(`${path(id)}/movements`, {
        params: {
          page,
          page_size: pageSize,
          ...(subjectKey ? { subject_key: subjectKey } : {}),
        },
      })
    ).data,
  charges: async (id: string, page = 1, definitionId?: string) =>
    (
      await apiClient.get<
        ApiResponse<{
          items: PlaceCharge[];
          total: number;
          page: number;
          page_size: number;
        }>
      >(`${path(id)}/charges`, {
        params: {
          page,
          page_size: 20,
          ...(definitionId ? { definition_id: definitionId } : {}),
        },
      })
    ).data,
  chargeDefinitions: async (id: string) =>
    (
      await apiClient.get<
        ApiResponse<{ items: PlaceChargeDefinition[]; total: number }>
      >(`${path(id)}/charges/definitions`)
    ).data,
  acknowledgeCharge: async (
    id: string,
    assignmentId: string,
    body: { cadence: string; note?: string | null },
  ) =>
    (
      await apiClient.post<ApiResponse<ChargeAcknowledgement>>(
        `/charges/assignments/${encodeURIComponent(assignmentId)}/acknowledge`,
        body,
      )
    ).data,
  members: async (id: string) =>
    (
      await apiClient.get<ApiResponse<WorkspaceRelationship[]>>(
        `${path(id)}/members`,
      )
    ).data,
  addMember: async (
    id: string,
    body: { display_name: string; email: string; role: string },
  ) =>
    (
      await apiClient.post<ApiResponse<WorkspaceRelationship>>(
        `${path(id)}/members`,
        body,
      )
    ).data,
  removeMember: async (id: string, relationshipId: string) =>
    (
      await apiClient.delete<ApiResponse<unknown>>(
        `${path(id)}/members/${relationshipId}`,
      )
    ).data,
};
