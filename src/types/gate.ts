import { Admin } from "./index";

export interface GateAdmin {
  id: string;
  gate_id: string;
  admin_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admin?: Admin;
}

export interface Gate {
  id: string;
  name: string;
  slug: string;
  is_default: boolean;
  site_id: string;
  place_id: string | null;
  admin_ids?: string[];
  dependency_id: string | null;
  created_at: string;
  updated_at: string;
  gate_admins?: GateAdmin[];
  dependency?: Gate;
  dependencies?: Gate[];
  allowed_entry?: boolean;
  allowed_exit?: boolean;
  automatic_direction?: boolean;
  manual_direction_override?: boolean;
  offline_policy?: "deny" | "queue" | "allow_verified";
  reentry_policy?: "allowed" | "denied" | "manual";
  allowed_credential_types?: Array<
    "invitation_code" | "invitation_qr" | "badge_qr" | "permanent_code"
  > | null;
  access_schedule?: {
    days?: number[];
    start?: string;
    end?: string;
  } | null;
  policy_version?: number;
}

export interface GateNode extends Gate {
  children: GateNode[];
}

export interface CreateGateRequest {
  name: string;
  site_id: string;
  place_id?: string | null;
  dependency_id: string | null;
  allowed_entry?: boolean;
  allowed_exit?: boolean;
  automatic_direction?: boolean;
  manual_direction_override?: boolean;
  offline_policy?: "deny" | "queue" | "allow_verified";
  reentry_policy?: "allowed" | "denied" | "manual";
  allowed_credential_types?: Array<
    "invitation_code" | "invitation_qr" | "badge_qr" | "permanent_code"
  >;
  access_schedule?: {
    days?: number[];
    start?: string;
    end?: string;
  } | null;
}

export interface UpdateGateRequest {
  name?: string;
  dependency_id?: string | null;
  is_default?: boolean;
  slug?: string;
  allowed_entry?: boolean;
  allowed_exit?: boolean;
  automatic_direction?: boolean;
  manual_direction_override?: boolean;
  offline_policy?: "deny" | "queue" | "allow_verified";
  reentry_policy?: "allowed" | "denied" | "manual";
  allowed_credential_types?: Array<
    "invitation_code" | "invitation_qr" | "badge_qr" | "permanent_code"
  >;
  access_schedule?: {
    days?: number[];
    start?: string;
    end?: string;
  } | null;
}
