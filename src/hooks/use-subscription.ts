"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    subscriptionService,
    SubscribeToPlanRequest,
    UpdateSubscriptionRequest,
    UpdateBillingSettingsRequest,
    SubscribeResponse,
} from "@/services/subscription-service";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";
import { useState } from "react";


/**
 * Hook to fetch a specific plan
 */
export function usePlan(idOrSlug: string) {
    return useQuery({
        queryKey: ["plans", idOrSlug],
        queryFn: async () => {
            const response = await subscriptionService.getPlan(idOrSlug);
            return response.data;
        },
        enabled: !!idOrSlug,
    });
}

/**
 * Hook to get current organization's subscription
 */
export function useCurrentSubscription() {
    return useQuery({
        queryKey: ["subscription", "current"],
        queryFn: async () => {
            const response = await subscriptionService.getCurrentSubscription();
            return response.data;
        },

    });
}

/**
 * Hook to subscribe to a plan
 * Returns either a subscription (free plans) or authorization URL (paid plans)
 */
export function useSubscribeToPlan() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (data: SubscribeToPlanRequest) =>
            subscriptionService.subscribe(data),
        onMutate: () => {
            setError(null);
        },
        onSuccess: (response) => {
            // Only show success and invalidate if it's a direct subscription (free plan)
            if (response.data?.is_active) {
                queryClient.invalidateQueries({ queryKey: ["subscription"] });
                queryClient.invalidateQueries({ queryKey: ["organization"] });
                toast.success("Successfully subscribed to plan!");
            }
            // For paid plans, the page will handle payment flow
        },
        onError: (err: unknown) => {
            const parsedError = parseApiError(err);
            setError(parsedError.message);
            toast.error(parsedError.message);
        },
    });

    return { ...mutation, error };
}

/**
 * Hook to poll subscription payment status
 */
export function useSubscriptionPaymentStatus(reference: string | null) {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ["subscription", "payment", reference],
        queryFn: async () => {
            if (!reference) return null;
            const response = await subscriptionService.getSubscriptionPaymentStatus(reference);
            return response.data;
        },
        enabled: !!reference,
        refetchInterval: (query) => {
            // Stop polling if payment is complete or failed
            const data = query.state.data;
            if (data?.status === "success" || data?.status === "failed") {
                // Invalidate queries on success
                if (data.status === "success") {
                    queryClient.invalidateQueries({ queryKey: ["subscription"] });
                    queryClient.invalidateQueries({ queryKey: ["organization"] });
                }
                return false;
            }
            // Poll every 2 seconds while pending
            return 2000;
        },
    });
}

/**
 * Hook to update subscription
 */
export function useUpdateSubscription() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (data: UpdateSubscriptionRequest) =>
            subscriptionService.updateSubscription(data),
        onMutate: () => {
            setError(null);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            toast.success("Subscription updated successfully!");
        },
        onError: (err: unknown) => {
            const parsedError = parseApiError(err);
            setError(parsedError.message);
            toast.error(parsedError.message);
        },
    });

    return { ...mutation, error };
}

/**
 * Hook to cancel subscription
 */
export function useCancelSubscription() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (cancelImmediately: boolean = false) =>
            subscriptionService.cancelSubscription(cancelImmediately),
        onMutate: () => {
            setError(null);
        },
        onSuccess: (_, cancelImmediately) => {
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            queryClient.invalidateQueries({ queryKey: ["organization"] });
            if (cancelImmediately) {
                toast.success("Subscription cancelled immediately");
            } else {
                toast.success("Subscription will be cancelled at the end of the billing period");
            }
        },
        onError: (err: unknown) => {
            const parsedError = parseApiError(err);
            setError(parsedError.message);
            toast.error(parsedError.message);
        },
    });

    return { ...mutation, error };
}

/**
 * Hook to reactivate subscription
 */
export function useReactivateSubscription() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: () => subscriptionService.reactivateSubscription(),
        onMutate: () => {
            setError(null);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            toast.success("Subscription reactivated successfully!");
        },
        onError: (err: unknown) => {
            const parsedError = parseApiError(err);
            setError(parsedError.message);
            toast.error(parsedError.message);
        },
    });

    return { ...mutation, error };
}

/**
 * Hook to fetch invoices
 */
export function useInvoices(page: number = 1, perPage: number = 10) {
    return useQuery({
        queryKey: ["invoices", page, perPage],
        queryFn: async () => {
            const response = await subscriptionService.getInvoices(page, perPage);
            return response;
        },
    });
}

/**
 * Hook to fetch a specific invoice
 */
export function useInvoice(invoiceId: string) {
    return useQuery({
        queryKey: ["invoices", invoiceId],
        queryFn: async () => {
            const response = await subscriptionService.getInvoice(invoiceId);
            return response.data;
        },
        enabled: !!invoiceId,
    });
}

/**
 * Hook to download invoice
 */
export function useDownloadInvoice() {
    const mutation = useMutation({
        mutationFn: async (invoiceId: string) => {
            const blob = await subscriptionService.downloadInvoice(invoiceId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        },
        onError: (err: unknown) => {
            const parsedError = parseApiError(err);
            toast.error(parsedError.message);
        },
    });

    return mutation;
}

/**
 * Hook to fetch billing settings
 */
export function useBillingSettings() {
    return useQuery({
        queryKey: ["billing", "settings"],
        queryFn: async () => {
            const response = await subscriptionService.getBillingSettings();
            return response.data;
        },
    });
}

/**
 * Hook to update billing settings
 */
export function useUpdateBillingSettings() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: (data: UpdateBillingSettingsRequest) =>
            subscriptionService.updateBillingSettings(data),
        onMutate: () => {
            setError(null);
            setFieldErrors({});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing", "settings"] });
            toast.success("Billing settings updated successfully!");
        },
        onError: (err: unknown) => {
            const parsedError = parseApiError(err);
            setError(parsedError.message);
            setFieldErrors(parsedError.fieldErrors);
            toast.error(parsedError.message);
        },
    });

    return { ...mutation, error, fieldErrors };
}

/**
 * Hook to fetch payment methods
 */
export function usePaymentMethods() {
    return useQuery({
        queryKey: ["payment-methods"],
        queryFn: async () => {
            const response = await subscriptionService.getPaymentMethods();
            return response.data;
        },
    });
}

/**
 * Hook to set default payment method
 */
export function useSetDefaultPaymentMethod() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (paymentMethodId: string) =>
            subscriptionService.setDefaultPaymentMethod(paymentMethodId),
        onMutate: () => {
            setError(null);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            queryClient.invalidateQueries({ queryKey: ["billing", "settings"] });
            toast.success("Default payment method updated!");
        },
        onError: (err: unknown) => {
            const parsedError = parseApiError(err);
            setError(parsedError.message);
            toast.error(parsedError.message);
        },
    });

    return { ...mutation, error };
}

/**
 * Hook to delete a payment method
 */
export function useDeletePaymentMethod() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (paymentMethodId: string) =>
            subscriptionService.deletePaymentMethod(paymentMethodId),
        onMutate: () => {
            setError(null);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            queryClient.invalidateQueries({ queryKey: ["billing", "settings"] });
            toast.success("Payment method removed successfully!");
        },
        onError: (err: unknown) => {
            const parsedError = parseApiError(err);
            setError(parsedError.message);
            toast.error(parsedError.message);
        },
    });

    return { ...mutation, error };
}

/**
 * Hook to create checkout session
 */
export function useCreateCheckoutSession() {
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (returnUrl: string) =>
            subscriptionService.createCheckoutSession(returnUrl),
        onMutate: () => {
            setError(null);
        },
        onSuccess: (response) => {
            // Redirect to checkout
            if (response.data?.authorization_url) {
                window.location.href = response.data.authorization_url;
            }
        },
        onError: (err: unknown) => {
            const parsedError = parseApiError(err);
            setError(parsedError.message);
            toast.error(parsedError.message);
        },
    });

    return { ...mutation, error };
}
