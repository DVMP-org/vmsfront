import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type AccessSiteStatus = "active" | "degraded" | "offline";
export type AccessLaneAvailability = "unknown" | "online" | "offline" | "fault";
export type AccessLaneState = "open" | "closed" | "unknown";
export type AccessDecisionOutcome = "allowed" | "denied";
export type AccessCommandAction = "open" | "close";
export type AccessCommandStatus =
  | "pending"
  | "acknowledged"
  | "completed"
  | "timed_out"
  | "rejected"
  | "offline";

export interface AccessSite {
  id: string;
  name: string;
  slug: string;
  status: AccessSiteStatus;
  created_at: string;
  updated_at: string;
}

export interface AccessLane {
  id: string;
  site_id: string;
  gate_id: string;
  name: string;
  slug: string;
  kind: "barrier" | "door" | "turnstile" | string;
  driver_name: string;
  availability: AccessLaneAvailability;
  observed_state: AccessLaneState;
  last_seen_at?: string | null;
  last_error_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessDecision {
  id: string;
  site_id: string;
  gate_id: string;
  lane_id: string;
  gate_event_id?: string | null;
  decided_by_admin_id?: string | null;
  outcome: AccessDecisionOutcome;
  reason_code: string;
  subject_type?: string | null;
  subject_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessCommand {
  id: string;
  site_id: string;
  gate_id: string;
  lane_id: string;
  decision_id: string;
  requested_by_admin_id?: string | null;
  action: AccessCommandAction;
  status: AccessCommandStatus;
  expires_at: string;
  acknowledged_at?: string | null;
  completed_at?: string | null;
  error_code?: string | null;
  message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessSimulationResponse {
  decision: AccessDecision;
  command?: AccessCommand | null;
  lane: AccessLane;
  replayed: boolean;
}

export interface AccessGateTopology {
  id: string;
  name: string;
  status: string;
  lanes: AccessLane[];
}

export interface AccessSiteTopology {
  site: AccessSite;
  gates: AccessGateTopology[];
}

export interface AccessTopologyResponse {
  places: AccessSiteTopology[];
}

export interface AccessDecisionPayload {
  idempotency_key: string;
  outcome: AccessDecisionOutcome;
  reason_code: string;
  gate_event_id?: string | null;
  checkpoint_event_id?: string | null;
  subject_type?: string | null;
  subject_id?: string | null;
  command_action?: AccessCommandAction;
  timeout_seconds?: number;
}

export interface AccessLaneStatePayload {
  availability?: AccessLaneAvailability;
  observed_state?: AccessLaneState;
  error_code?: string | null;
}

const ACCESS_CONTROL_API = "/admin/access-control";

export const accessControlService = {
  async getTopology(): Promise<AccessTopologyResponse> {
    return (
      await apiClient.get<ApiResponse<AccessTopologyResponse>>(
        `${ACCESS_CONTROL_API}/topology`,
      )
    ).data;
  },

  async createSite(payload: { name: string }): Promise<AccessSite> {
    return (
      await apiClient.post<ApiResponse<AccessSite>>(
        `${ACCESS_CONTROL_API}/sites`,
        payload,
      )
    ).data;
  },

  async createLane(
    siteId: string,
    payload: {
      gate_id: string;
      name: string;
      kind: "barrier" | "door" | "turnstile";
      driver_name?: string;
    },
  ): Promise<AccessLane> {
    return (
      await apiClient.post<ApiResponse<AccessLane>>(
        `${ACCESS_CONTROL_API}/sites/${siteId}/lanes`,
        payload,
      )
    ).data;
  },

  async simulateDecision(
    laneId: string,
    payload: AccessDecisionPayload,
  ): Promise<AccessSimulationResponse> {
    return (
      await apiClient.post<ApiResponse<AccessSimulationResponse>>(
        `${ACCESS_CONTROL_API}/lanes/${laneId}/decisions`,
        payload,
      )
    ).data;
  },

  async updateLaneState(
    laneId: string,
    payload: AccessLaneStatePayload,
  ): Promise<AccessLane> {
    return (
      await apiClient.post<ApiResponse<AccessLane>>(
        `${ACCESS_CONTROL_API}/lanes/${laneId}/state`,
        payload,
      )
    ).data;
  },

  async acknowledgeCommand(
    commandId: string,
    payload: { accepted: boolean; message?: string },
  ): Promise<AccessCommand> {
    return (
      await apiClient.post<ApiResponse<AccessCommand>>(
        `${ACCESS_CONTROL_API}/commands/${commandId}/acknowledge`,
        payload,
      )
    ).data;
  },

  async expireCommands(): Promise<{ expired: number }> {
    return (
      await apiClient.post<ApiResponse<{ expired: number }>>(
        `${ACCESS_CONTROL_API}/commands/expire`,
      )
    ).data;
  },

  async listCommands(params?: {
    laneId?: string;
    status?: AccessCommandStatus;
  }): Promise<AccessCommand[]> {
    return (
      await apiClient.get<ApiResponse<AccessCommand[]>>(
        `${ACCESS_CONTROL_API}/commands`,
        {
          params: {
            lane_id: params?.laneId,
            status: params?.status,
          },
        },
      )
    ).data;
  },
};
