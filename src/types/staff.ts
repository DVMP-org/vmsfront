import { Admin, Gate, GateEvent, PaginatedResponse, Residency, Resident, User } from "./index";

export type StaffStatus = "pending" | "active" | "suspended" | "inactive" | "revoked" | string;
export type StaffKYCStatus = "pending" | "submitted" | "verified" | "failed" | string;
export type StaffEntryMode = "free" | "approval_required" | "blocked" | string;

export interface StaffProfileCreate {
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    staff_type?: string | null;
}

export interface StaffProfileUpdate {
    staff_type?: string | null;
    status?: string | null;
}

export interface StaffStatusUpdate {
    status: string;
}

export interface StaffAssignmentUpdate {
    notes?: string | null;
    is_active?: boolean;
    valid_from?: string | null;
    valid_to?: string | null;
}

export interface StaffMovementPermissionCreate {
    allowed_days?: string[] | null;
    time_start?: string | null;
    time_end?: string | null;
    allowed_gates?: string[] | null;
    entry_mode?: string;
    exit_mode?: string;
    requires_host_confirmation?: boolean;
    notes?: string | null;
}

export interface StaffKYCSubmit {
    document_type: string;
    document_number_masked?: string | null;
    provider?: string;
}

export interface StaffKYCReview {
    status: string;
    notes?: string | null;
}

export interface StaffMovementPermission {
    id: string;
    staff_profile_id?: string | null;
    assignment_id?: string | null;
    allowed_days?: string[] | null;
    time_start?: string | null;
    time_end?: string | null;
    allowed_gates?: string[] | null;
    entry_mode?: StaffEntryMode | null;
    exit_mode?: StaffEntryMode | null;
    requires_host_confirmation?: boolean;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    gates?: Gate[] | null;
}

export interface StaffKYCVerification {
    id: string;
    staff_profile_id?: string | null;
    document_type?: string | null;
    document_number_masked?: string | null;
    provider?: string | null;
    status?: StaffKYCStatus | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    reviewed_at?: string | null;
    submitted_at?: string | null;
    reviewer?: Admin | null;
}

export interface StaffResidencyAssignment {
    id: string;
    staff_profile_id?: string | null;
    residency_id?: string | null;
    sponsor_resident_id?: string | null;
    notes?: string | null;
    is_active?: boolean;
    valid_from?: string | null;
    valid_to?: string | null;
    created_at?: string;
    updated_at?: string;
    residency?: Residency | null;
    sponsor_resident?: Resident | null;
    movement_permission?: StaffMovementPermission | null;
}

export interface StaffMember {
    id: string;
    user_id?: string | null;
    staff_type?: string | null;
    status?: StaffStatus | null;
    created_at?: string;
    updated_at?: string;
    user?: User | null;
    assignment?: StaffResidencyAssignment | null;
    latest_kyc?: StaffKYCVerification | null;
    kyc_verification?: StaffKYCVerification | null;
    movement_permission?: StaffMovementPermission | null;
    residency?: Residency | null;
    sponsor_resident?: Resident | null;
}

export type StaffMovementLog = Omit<GateEvent, "owner" | "owner_type"> & {
    owner_type: "staff" | string;
    owner?: StaffMember | Resident | undefined;
    staff?: StaffMember | null;
    gate?: Gate | null;
    residency?: Residency | null;
};

export type StaffListResponse = PaginatedResponse<StaffMember>;
export type StaffMovementLogResponse = PaginatedResponse<StaffMovementLog>;
