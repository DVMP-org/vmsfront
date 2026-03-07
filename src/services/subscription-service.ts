import { apiClient } from "@/lib/api-client";
import {
    ApiResponse,
    PaginatedResponse,
} from "@/types";
import { Invoice, Plan, Subscription } from "@/types/subscription";

export interface BillingDetails {
    billing_email?: string;
    billing_name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    tax_id?: string;
}

export interface SubscribeToPlanRequest {
    plan_id: string;
    billing_cycle: "monthly" | "yearly";
    billing_details?: BillingDetails;
}

// Response for subscribe - can be either a direct subscription or payment required
export interface SubscribeResponse {
    // For free plans - direct subscription
    subscription?: Subscription;
    // For paid plans - payment required
    authorization_url?: string;
    reference?: string;
}

export interface UpdateSubscriptionRequest {
    plan_id?: string;
    billing_cycle?: "monthly" | "yearly";
    cancel_at_period_end?: boolean;
}

export interface PaymentMethod {
    id: string;
    type: string;
    last4?: string;
    brand?: string;
    exp_month?: string;
    exp_year?: string;
    is_default?: boolean;
    created_at?: string;
}

export interface BillingSettings {
    billing_email?: string | null;
    billing_name?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    tax_id?: string | null;
    payment_method?: PaymentMethod | null;
}

export interface UpdateBillingSettingsRequest {
    billing_email?: string;
    billing_name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    tax_id?: string;
}

export const subscriptionService = {
    /**
     * Get all available subscription plans
     */


    /**
     * Get a specific plan by ID or slug
     */
    async getPlan(idOrSlug: string): Promise<ApiResponse<Plan>> {
        return apiClient.get(`/plans/${idOrSlug}`);
    },

    /**
     * Get the current organization's subscription
     */
    async getCurrentSubscription(): Promise<ApiResponse<Subscription | null>> {
        return apiClient.get("/organizations/subscription/current");
    },

    /**
     * Subscribe to a plan
     * For free plans: Returns subscription object directly
     * For paid plans: Returns authorization_url and reference for payment
     */
    async subscribe(data: SubscribeToPlanRequest): Promise<ApiResponse<SubscribeResponse>> {
        return apiClient.post("/organizations/subscribe", data);
    },

    /**
     * Get subscription payment status by reference
     */
    async getSubscriptionPaymentStatus(reference: string): Promise<ApiResponse<{
        status: "pending" | "success" | "failed";
        subscription?: Subscription;
    }>> {
        return apiClient.get(`/organizations/subscription/payment/${reference}`);
    },

    /**
     * Update subscription (change plan or billing cycle)
     */
    async updateSubscription(data: UpdateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
        return apiClient.patch("/admin/subscription", data);
    },

    /**
     * Cancel subscription
     */
    async cancelSubscription(cancelImmediately: boolean = false): Promise<ApiResponse<Subscription>> {
        return apiClient.post("/admin/subscription/cancel", { cancel_immediately: cancelImmediately });
    },

    /**
     * Reactivate a canceled subscription
     */
    async reactivateSubscription(): Promise<ApiResponse<Subscription>> {
        return apiClient.post("/admin/subscription/reactivate", {});
    },

    /**
     * Get billing history/invoices
     */
    async getInvoices(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Invoice>> {
        return apiClient.get(`/admin/subscription/invoices?page=${page}&per_page=${perPage}`);
    },

    /**
     * Get a specific invoice
     */
    async getInvoice(invoiceId: string): Promise<ApiResponse<Invoice>> {
        return apiClient.get(`/admin/subscription/invoices/${invoiceId}`);
    },

    /**
     * Download invoice PDF
     */
    async downloadInvoice(invoiceId: string): Promise<Blob> {
        return apiClient.get(`/admin/subscription/invoices/${invoiceId}/download`, {
            responseType: "blob",
        });
    },

    /**
     * Get billing settings
     */
    async getBillingSettings(): Promise<ApiResponse<BillingSettings>> {
        return apiClient.get("/user/billing");
    },

    /**
     * Update billing settings
     */
    async updateBillingSettings(data: UpdateBillingSettingsRequest): Promise<ApiResponse<BillingSettings>> {
        return apiClient.patch("/user/billing", data);
    },

    /**
     * Get payment methods
     */
    async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
        return apiClient.get("/user/payment-methods");
    },

    /**
     * Set default payment method
     */
    async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<PaymentMethod>> {
        return apiClient.post(`/user/payment-methods/${paymentMethodId}/default`, {});
    },

    /**
     * Delete a payment method
     */
    async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<void>> {
        return apiClient.delete(`/user/payment-methods/${paymentMethodId}`);
    },

    /**
     * Create checkout session for adding payment method
     */
    async createCheckoutSession(returnUrl: string): Promise<ApiResponse<{ authorization_url: string }>> {
        return apiClient.post("/admin/subscription/checkout", { return_url: returnUrl });
    },
};
