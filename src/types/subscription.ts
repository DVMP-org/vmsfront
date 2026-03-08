
export enum SubscriptionStatus {
    ACTIVE = "active",
    PAST_DUE = "past_due",
    CANCELED = "canceled",
}
export enum InvoiceStatus {
    DRAFT = "draft",
    OPEN = "open",
    PAID = "paid",
    OVERDUE = "overdue",
    CANCELED = "canceled",
}

export enum SubscriptionEventType {
    TRIAL_STARTED = "trial_started",
    TRIAL_ENDED = "trial_ended",
    ACTIVATED = "activated",
    REACTIVATED = "reactivated",
    SUSPENDED = "suspended",
    CANCELLED = "cancelled",
    PAYMENT_FAILED = "payment_failed",
    PAYMENT_RECOVERED = "payment_recovered",
    EXPIRED = "expired",
}

export interface Subscription {
    id: string,
    organization_id: string,
    plan_id: string
    status: SubscriptionStatus
    is_active: boolean
    is_trialing: boolean
    billing_cycle?: string | null
    current_period_start?: string | null
    current_period_end?: string | null
    cancel_at_period_end?: boolean | null
    trial_ends_at?: string | null
    created_at: string
    updated_at: string

    plan: Plan | null;
}

export interface Plan {
    id: string,
    name: string,
    slug: string,
    description?: string | null,
    price_monthly: number,
    price_yearly: number,
    features?: Record<string, any> | null,
    trial_days?: number | null,
    is_active: boolean,
    sort_order: number,
    created_at: string,
    updated_at: string,
}

export interface Invoice {

    id: string,
    subscription_id: string,
    organization_id: string,
    amount_due: number
    amount_paid: number
    currency: string
    due_date?: string | null
    status: InvoiceStatus
    period_start?: string | null
    period_end: string | null
    paid_at: string | null,
    created_at: string
    updated_at: string

}