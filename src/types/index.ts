// Enums
export enum GatePassStatus {
    PENDING = "pending",
    CHECKED_IN = "checked_in",
    CHECKED_OUT = "checked_out",
    COMPLETED = "completed",
    REVOKED = "revoked",
    EXPIRED = "expired",
}

export enum ScanType {
    ENTRY = "entry",
    EXIT = "exit",
}

export enum UserType {
    RESIDENT = "resident",
    ADMIN = "admin",
}

// Base Types
export interface User {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface House {
    id: string;
    name: string;
    description: string | null;
    address: string;
    slug?: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserHouseMembership {
    id: string;
    house: House;
    status?: string;
    is_primary?: boolean;
    resident_super_user?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ResidentProfileUpdatePayload {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    avatar_url?: string | null;
}

export interface AdminProfileUpdatePayload {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    title?: string | null;
    avatar_url?: string | null;
}

export interface Resident {
    id: string;
    user_id: string;
    pass_code: string | null;
    badge_url: string | null;
    slug?: string | null;
    onboarded?: boolean;
    created_at: string;
    email?: string;
    name?: string;
    updated_at: string;
    user?: User | null;
    houses?: House[];
}

export interface ResidentUser {
    user: User;
    resident: Resident;
    houses: House[];
}

export interface ResidentUserCreate {
    user_id: string;
    house_slugs: string[];
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    email?: string;
}

export interface Visitor {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    pass_code_suffix: string | null;
    qr_code_url: string | null;
    pass_code?: string; // Computed: gate_pass_code-pass_code_suffix
    gate_pass_id?: string | null;
    gate_pass_code?: string | null;
    gate_pass?: {
        id: string;
        code: string;
        house_id: string;
        resident_id?: string | null;
        qr_code_url?: string | null;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface ForumCategory {
    id: string;
    house_id?: string | null;
    slug: string;
    name: string;
    description?: string | null;
    is_default: boolean;
    is_locked?: boolean;
    topics_count?: number;
    house?: House | null;
    last_activity_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface ForumPostAttachment {
    url: string;
    name: string;
    mime?: string;
}

export interface ForumPost {
    id: string;
    topic_id: string;
    house_id?: string | null;
    house?: House | null;
    author_id?: string | null;
    content: string;
    attachments?: ForumPostAttachment[] | null;
    is_deleted: boolean;
    edited_at?: string | null;
    created_at?: string | null;
    author?: User | null;
    author_name?: string;
    deleted_at?: string | null;
    restored_at?: string | null;
    posted_by_admin?: boolean;
}

export interface ForumTopic {
    id: string;
    house_id?: string | null;
    category_id: string;
    title: string;
    slug: string;
    author_id?: string | null;
    is_pinned: boolean;
    is_locked: boolean;
    is_deleted: boolean;
    posts_count: number;
    last_post_by?: string | null;
    last_post_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    author?: User | null;
    author_name?: string | null;
    house?: House | null;
    category?: ForumCategory | null;
    initial_post?: ForumPost | null;
    latest_post?: ForumPost | null;
    forum_posts?: ForumPost[];
}

export interface GatePass {
    id: string;
    code: string;
    qr_code_url: string | null;
    house_id: string;
    resident_id: string;
    valid_from: string | null;
    valid_to: string | null;
    status: GatePassStatus;
    max_uses: number | null;
    uses_count: number;
    created_at: Date;
    updated_at: Date;
    visitors: Visitor[];
    gate_events?: GateEvent[];
    house?: House
}

export interface GateEvent {
    id: string;
    owner_type: string;
    owner_id: string;
    scanned_by_id: string;
    checkin_time: string;
    checkout_time: string | null;
    created_at: string;
    updated_at: string;
    owner?: Visitor | Resident;
    gate_pass?: GatePass;
    scanned_by?: Admin
    
}

export interface AdminRole {
    id: string;
    name: string;
    description: string | null;
    code: string;
    permissions: string[] | Record<string, string[]> | string;
    permissions_parsed: string[];
    created_at: string;
    updated_at: string;
}

export interface Admin {
    id: string;
    user: User;
    role_id: string | null;
    permissions: string | null;
    created_at: string;
    updated_at: string;
    role: AdminRole | null;
    name: string;
}

export interface UserProfile extends User {
    user_type?: UserType | null;
    resident?: Resident | null;
    admin?: Admin | null;
    houses?: House[];
    memberships?: UserHouseMembership[];
    roles?: AdminRole[];
    admin_roles?: AdminRole[];
    is_admin?: boolean;
    is_resident?: boolean;
    permissions?: string[] | Record<string, unknown> | null;
}

export interface AdminSummary {
    id: string;
    user_id: string;
    role_id: string | null;
    permissions: string | null;
    created_at: string;
    updated_at: string;
}

export interface DashboardSelect {
    user: UserProfile;
    houses: House[];
    admin: AdminSummary | null;
}

export interface ResidentDashboard {
    resident: Resident;
    house: House;
    gate_passes: GatePass[];
    gate_events: GateEvent[];
    gate_events_approved: number;
    gate_events_denied: number;
}

// Request Types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    password: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
    email: string;
}

export interface CreateGatePassRequest {
    resident_id: string;
    house_id: string;
    valid_from: string;
    valid_to: string;
    max_uses?: number;
    visitors: {
        email: string;
        name: string;
        phone?: string;
    }[];
}

export interface CreateHouseRequest {
    name: string;
    description?: string;
    address: string;
}

export interface CreateAdminRequest {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    title?: string;
    role_id?: string;
    permissions?: string;
}

export interface UpdateAdminRoleRequest {
    role_id: string;
}

export interface GatePassCheckinRequest {
    code: string;
    visitor_id?: string;
}

export interface ForumCategoryPayload {
    house_id: string;
    name: string;
    description?: string;
    is_default?: boolean;
    is_locked?: boolean;
}

export interface ForumCategoryUpdatePayload {
    name?: string;
    description?: string;
    is_default?: boolean;
    is_locked?: boolean;
    house_id?: string;
}

export interface ForumTopicCreatePayload {
    house_id: string;
    category_id: string;
    title: string;
    content: string;
}

export interface ForumTopicUpdatePayload {
    title?: string;
    category_id?: string;
    house_id?: string;
    is_pinned?: boolean;
    is_locked?: boolean;
    is_deleted?: boolean;
    hard_delete?: boolean;
}

export interface ForumPostCreatePayload {
    topic_id: string;
    content: string;
    attachments?: ForumPostAttachment[];
    house_id?: string;
}

export interface ForumPostUpdatePayload {
    content?: string;
    is_deleted?: boolean;
    restore?: boolean;
    attachments?: ForumPostAttachment[] | null;
}

// Response Types
export interface AuthResponse {
    user: UserProfile;
    token: string;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: string;
    success?: boolean;
    status_code?: number;
}

export interface GatePassCheckinResponse {
    status: string; // Can be "select_visitor", "checked_in", "checked_out", etc.
    message: string;
    gate_pass: GatePass | null;
    gate_event: GateEvent | null;
    owner: Visitor | Resident | null;
    uses_count: number | null;
    max_uses: number | null;
}

export interface PermissionDictionary {
    [resource: string]: string[];
}

export interface AllPermissionsResponse {
    permissions: PermissionDictionary;
}

// Analytics Types
export interface AnalyticsTimeSeriesPoint {
    date: string;
    count: number;
}

export interface AnalyticsTimeSeries {
    houses: AnalyticsTimeSeriesPoint[];
    gate_passes: AnalyticsTimeSeriesPoint[];
    visitors: AnalyticsTimeSeriesPoint[];
    checkins: AnalyticsTimeSeriesPoint[];
    checkouts: AnalyticsTimeSeriesPoint[];
}

export interface AnalyticsSummary {
    total_residents: number;
    total_houses: number;
    total_gate_passes: number;
    total_gate_events: number;
    total_gate_events_approved: number;
    total_gate_events_denied: number;
    total_admins: number;
    total_roles: number;
    total_visitors: number;
    time_series: AnalyticsTimeSeries;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next?: boolean;
    has_previous?: boolean;
}

export interface ImportResponse<T = any> {
    total: number;
    successful: number;
    failed: number;
    results: T[];
}

// Branding Types
export interface BrandingConfig {
    app_name: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    email_from: string | null;
    sms_sender_id: string | null;
}


export interface AdminDashboard {
    houses: House[];
    residents: ResidentUser[];
    gate_passes: GatePass[];
    gate_events: GateEvent[];
}

// Electricity Plugin Types
export interface Meter {
    id: string;
    meter_number: string;
    meter_type: string;
    disco: string;
    house_id: string;
    created_at?: string;
    updated_at?: string;
    house?: {
        id: string;
        name: string;
        address: string;
    };
}

export interface MeterCreate {
    meter_number: string;
    meter_type: string;
    disco: string;
    house_id: string;
}

export interface PurchaseTokenCreate {
    meter_id: string;
    amount: string;
    house_id: string;
    email: string;
}

export interface PurchaseToken {
    id: string;
    meter_id: string;
    amount: string;
    house_id: string;
    email: string;
    token?: string;
    units?: number;
    status?: string;
    transaction_id?: string;
    created_at?: string;
    updated_at?: string;
    meter?: Meter;
}
