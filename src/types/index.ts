import { Gate } from "./gate";

// Enums
export enum GatePassStatus {
    ACTIVE = "active",
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

export enum DueTenureLength {
    ONE_TIME = "one_time",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    BIANNUALLY = "biannually",
    YEARLY = "yearly",
}

export enum HouseDueStatus {
    UNPAID = "unpaid",
    PARTIALLY_PAID = "partially_paid",
    PAID = "paid",
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
    email_verified_at: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
    name?: string | null
}

export interface House {
    id: string;
    name: string;
    description: string | null;
    address: string;
    slug?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    house_groups?: HouseGroup[] | null;

}

export interface HouseGroup {
    id: string;
    name: string;
    description: string | null;
    house_ids: string[];
    houses?: House[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateHouseGroupRequest {
    name: string;
    description?: string | null;
    house_ids: string[];
}

export interface UpdateHouseGroupRequest {
    name?: string;
    description?: string | null;
    house_ids?: string[];
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
    houses?: House[] | null;
}

export interface HouseDetail {
    house: House;
    house_groups?: HouseGroup[];
    residents?: ResidentUser[];
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
    status?: VisitorStatus;
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

export enum VisitorStatus {
    CHECKED_IN = "checked_in",
    CHECKED_OUT = "checked_out",
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    REVOKED = "revoked",
    EXPIRED = "expired",
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
    updated_at?: string | null;
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
    house_id?: string | null;
    gate_id?: string | null;
    updated_at: string;
    owner?: Visitor | Resident;
    gate_pass?: GatePass | null;
    scanned_by?: Admin | null;
    house?: House | null;
    gate?: Gate | null;

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
    // admin: AdminSummary | null;
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

export interface UpdateHouseRequest {
    name: string;
    description?: string;
    address: string;
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
    success: boolean;
    message: string;
    data: T;
    errors?: Record<string, string[]>;
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

export interface BrandingTheme {
    id: string;
    name: string;
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
    dark_logo_url: string | null;
    favicon_url: string | null;
    custom_css: string | null;
    custom_js: string | null;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateBrandingThemeRequest {
    name: string;
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
    dark_logo_url?: string;
    favicon_url?: string;
    custom_css?: string;
    custom_js?: string;
}

export interface UpdateBrandingThemeRequest {
    name?: string;
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string | null;
    dark_logo_url?: string | null;
    favicon_url?: string | null;
    custom_css?: string | null;
    custom_js?: string | null;
    active?: boolean;
}

export interface AdminDashboard {
    houses: House[];
    residents: ResidentUser[];
    gate_passes: GatePass[];
    gate_events: GateEvent[];
}

// Wallet Types
export interface Wallet {
    id: string;
    resident_id: string;
    balance: number;
    status: "active" | "frozen" | "closed";
    created_at: string;
    updated_at: string;
}

export interface FundWalletRequest {
    amount: number;
    description: string;
}

export interface FundWalletResponse {
    access_code: string;
    reference: string;
    authorization_url: string;
    status: string;
}

export interface WalletTransaction {
    id: string;
    wallet_id: string;
    reference: string;
    balance_before: number;
    amount: number;
    balance_after: number;
    type: "credit" | "debit";
    status: "pending" | "success" | "failed";
    description: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

export enum TransactionType {
    WALLET_FUNDING = "wallet_funding",
    DUE_PAYMENT = "due_payment",
    PLUGIN_PURCHASE = "plugin_purchase",
    INTERNAL_DEBIT = "internal_debit",
    INTERNAL_CREDIT = "internal_credit"
}

export interface Transaction {
    id: string;
    reference: string;
    amount: number;
    type: TransactionType;
    status: "pending" | "success" | "failed";
    paid_at: string | null;
    processor: string | null;
    description: string | null;
    currency: string;
    payload: Record<string, any> | null;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}
// Payment Gateway Types
export interface PaymentGateway {
    name: string;
    description?: string | null;
    api_key?: string | null;
    secret_key?: string | null;
    secret_hash?: string | null;
    contract_code?: string | null;
    client_id?: string | null;
    client_secret?: string | null;
    public_key?: string | null;
    base_url?: string | null;
    redirect_url?: string | null;
    sandbox_mode: boolean;
    active: boolean;
}

export interface UpdatePaymentGatewayRequest {
    name: string;
    description?: string | null;
    api_key?: string | null;
    secret_key?: string | null;
    secret_hash?: string | null;
    contract_code?: string | null;
    client_id?: string | null;
    client_secret?: string | null;
    public_key?: string | null;
    base_url?: string | null;
    redirect_url?: string | null;
    sandbox_mode?: boolean;
    active?: boolean;
}

export interface ResidentHouse {
    resident: Resident;
    house: House;
    is_super_user: boolean;
    is_active: boolean;
}

export interface HouseLite {
    id: string;
    name: string;
    address: string;
}

export interface Due {
    id: string;
    name: string;
    description?: string | null;
    amount: number;
    minimum_payment_breakdown: DueTenureLength;
    tenure_length: DueTenureLength;
    recurring: boolean;
    houses: HouseLite[];
    start_date?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateDueRequest {
    name: string;
    description: string;
    amount: number;
    house_groups_ids: string[];
    houses_ids: string[];
    minimum_payment_breakdown: string; // DueTenureLength
    tenure_length: string; // DueTenureLength
    recurring: boolean;
    start_date?: string;
}

export interface ResidentCreate {

    email: string;
    house_id: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
}
export interface HouseDueOption {
    payment_breakdown: string;
    amount: string;
    due_amount: number;
    currency: {
        iso_name: string;
        currency: string;
    };
}

export interface HouseDue {
    id: string;
    due_id: string;
    house_id: string;
    due?: Due;
    house?: House;
    amount: number;
    balance: number;
    paid_amount: number;
    status: HouseDueStatus;
    payment_breakdown?: string | null;
    payment_completed?: boolean;
    schedules?: DueSchedule[];
    payments?: DuePayment[];
    payment_breakdown_options?: HouseDueOption[];
    created_at: string;
    updated_at: string;
    next_schedule?: DuePayment | null;
}

export interface DueSchedule {
    id: string;
    due_id: string;
    house_id: string;
    house_due_id: string;
    payment_date: string;
    balance_before: number;
    balance_after: number;
    amount: number;
    created_at: string;
    updated_at: string;
    is_paid: boolean;
    is_payable: boolean;
    payment?: DuePayment;
}

export interface DuePayment {
    id: string;
    due_id: string;
    house_id: string;
    house_due_id: string;
    due_schedule_id?: string;
    payment_date: string;
    amount: number;
    created_at: string;
    updated_at: string;
    due?: Due;
    schedule?: Partial<DueSchedule>;
}

export interface DatabaseNotification {
    title: string;
    message: string;
    intent: string;
}

export interface NotificationResponse {
    id: string;
    event: string;
    recipient: string;
    payload: DatabaseNotification;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export * from "./gate";
