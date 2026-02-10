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
    admin_ids: string[];
    dependency_id: string | null;
    created_at: string;
    updated_at: string;
    gate_admins?: GateAdmin[];
    dependency?: Gate;
    dependencies?: Gate[];
}

export interface GateNode extends Gate {
    children: GateNode[];
}

export interface CreateGateRequest {
    name: string;
    admin_ids: string[];
    dependency_id: string | null;
}

export interface UpdateGateRequest {
    name?: string;
    admin_ids?: string[];
    dependency_id?: string | null;
    is_default?: boolean;
    slug?: string;
}
