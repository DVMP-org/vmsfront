"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
import { PaymentGateway, UpdatePaymentGatewayRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { Edit, CheckCircle2, XCircle, Loader2, AlertCircle, Copy, Check, Webhook } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";

export function PaymentGatewaysSection() {
    const queryClient = useQueryClient();
    const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
    const [formState, setFormState] = useState<UpdatePaymentGatewayRequest>({
        name: "",
        description: "",
        sandbox_mode: false,
        active: false,
    });

    // Get base URL for webhook generation (uses API URL since webhooks go to backend)
    const getBaseUrl = () => {
        if (typeof window === "undefined") return "";
        // Use API URL from environment variable (webhooks go to backend API)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL

        try {
            // Handle both full URLs and hostname-only strings
            if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
                const url = new URL(apiUrl);
                return `${url.protocol}//${url.host}`;
            } else {
                // If it's a hostname only (like "api.gatekeeperhq.cfd"), add protocol
                const protocol = window.location.protocol;
                return `${protocol}//${apiUrl.replace(/^\/+/, "")}`;
            }
        } catch {
            // Fallback to current origin if parsing fails
            return window.location.origin;
        }
    };

    // Generate webhook URL for a gateway
    const getWebhookUrl = (gatewayName: string) => {
        const baseUrl = getBaseUrl();
        const gatewaySlug = gatewayName.toLowerCase().replace(/\s+/g, "-");
        return `${baseUrl}/webhooks/${gatewaySlug}`;
    };

    const copyWebhookUrl = (gatewayName: string) => {
        const webhookUrl = getWebhookUrl(gatewayName);
        navigator.clipboard.writeText(webhookUrl);
        setCopiedWebhook(gatewayName);
        toast.success("Webhook URL copied to clipboard");
        setTimeout(() => setCopiedWebhook(null), 2000);
    };

    const { data: gateways, isLoading } = useQuery<PaymentGateway[]>({
        queryKey: ["admin", "payment-gateways"],
        queryFn: async () => {
            const response = await adminService.getPaymentGateways();
            return response.data;
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ gatewayName, data }: { gatewayName: string; data: UpdatePaymentGatewayRequest }) =>
            adminService.updatePaymentGateway(gatewayName, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "payment-gateways"] });
            setEditModalOpen(false);
            setEditingGateway(null);
            toast.success("Payment gateway updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update payment gateway");
        },
    });

    const handleOpenEditModal = (gateway: PaymentGateway) => {
        setEditingGateway(gateway);
        // Standard fields - always included
        const initialFormState: UpdatePaymentGatewayRequest = {
            name: gateway.name,
            description: gateway.description || "",
            sandbox_mode: gateway.sandbox_mode || false,
            active: gateway.active || false,
        };

        // Add credential fields only if they are not null in the gateway response
        if (gateway.api_key !== null) {
            initialFormState.api_key = gateway.api_key;
        }
        if (gateway.secret_key !== null) {
            initialFormState.secret_key = gateway.secret_key;
        }
        if (gateway.secret_hash !== null) {
            initialFormState.secret_hash = gateway.secret_hash;
        }
        if (gateway.contract_code !== null) {
            initialFormState.contract_code = gateway.contract_code;
        }
        if (gateway.client_id !== null) {
            initialFormState.client_id = gateway.client_id;
        }
        if (gateway.client_secret !== null) {
            initialFormState.client_secret = gateway.client_secret;
        }
        if (gateway.public_key !== null) {
            initialFormState.public_key = gateway.public_key;
        }
        if (gateway.base_url !== null) {
            initialFormState.base_url = gateway.base_url;
        }
        if (gateway.redirect_url !== null) {
            initialFormState.redirect_url = gateway.redirect_url;
        }

        setFormState(initialFormState);
        setEditModalOpen(true);
    };

    const handleUpdateGateway = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingGateway) return;

        // Standard fields - always included
        const data: UpdatePaymentGatewayRequest = {
            name: formState.name.trim(),
            description: formState.description?.trim() || null,
            sandbox_mode: formState.sandbox_mode,
            active: formState.active,
        };

        // Only add credential fields that were not null in the original gateway response
        if (editingGateway.api_key !== null) {
            data.api_key = formState.api_key?.trim() || null;
        }
        if (editingGateway.secret_key !== null) {
            data.secret_key = formState.secret_key?.trim() || null;
        }
        if (editingGateway.secret_hash !== null) {
            data.secret_hash = formState.secret_hash?.trim() || null;
        }
        if (editingGateway.contract_code !== null) {
            data.contract_code = formState.contract_code?.trim() || null;
        }
        if (editingGateway.client_id !== null) {
            data.client_id = formState.client_id?.trim() || null;
        }
        if (editingGateway.client_secret !== null) {
            data.client_secret = formState.client_secret?.trim() || null;
        }
        if (editingGateway.public_key !== null) {
            data.public_key = formState.public_key?.trim() || null;
        }
        if (editingGateway.base_url !== null) {
            data.base_url = formState.base_url?.trim() || null;
        }
        if (editingGateway.redirect_url !== null) {
            data.redirect_url = formState.redirect_url?.trim() || null;
        }

        updateMutation.mutate({ gatewayName: editingGateway.name, data });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!gateways || gateways.length === 0) {
        return (
            <div className="border border-zinc-200 rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground">No payment gateways configured</p>
            </div>
        );
    }

    const hasActiveGateway = gateways.some((gateway) => gateway.active);

    return (
        <>
            {!hasActiveGateway && (
                <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-amber-900">Payment Gateway Required</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                At least one payment gateway needs to be set to active for payments to work. Please configure and activate a payment gateway.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="border border-zinc-200 rounded-lg">
                <div className="border-b border-zinc-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-foreground">Payment Gateways</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage payment gateway credentials and settings</p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Gateway</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[280px]">Webhook URL</TableHead>
                            <TableHead className="w-[100px]">Mode</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gateways.map((gateway, index) => {
                            const webhookUrl = getWebhookUrl(gateway.name);
                            const isCopied = copiedWebhook === gateway.name;
                            return (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="font-medium text-sm text-foreground">{gateway.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-muted-foreground">{gateway.description || "—"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 bg-muted/50 rounded px-2 py-1.5 border border-zinc-200">
                                                    <Webhook className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                    <code className="text-xs font-mono text-foreground truncate">
                                                        {webhookUrl}
                                                    </code>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => copyWebhookUrl(gateway.name)}
                                                className="p-1.5 hover:bg-muted rounded transition-colors flex-shrink-0"
                                                title="Copy webhook URL"
                                            >
                                                {isCopied ? (
                                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                )}
                                            </button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={gateway.sandbox_mode ? "secondary" : "default"} className="text-xs">
                                            {gateway.sandbox_mode ? "Sandbox" : "Live"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {gateway.active ? (
                                            <Badge className="bg-green-500 text-white text-xs">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Inactive
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenEditModal(gateway)}
                                            className="h-7 px-2"
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => {
                    if (!updateMutation.isPending) {
                        setEditModalOpen(false);
                        setEditingGateway(null);
                    }
                }}
                title="Edit Payment Gateway"
                size="lg"
            >
                <form onSubmit={handleUpdateGateway} className="space-y-4">
                    <Input
                        label="Gateway Name"
                        value={formState.name}
                        onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        disabled
                    />

                    <Input
                        label="Description"
                        value={formState.description || ""}
                        onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Payment gateway description"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Sandbox Mode</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formState.sandbox_mode}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, sandbox_mode: e.target.checked }))}
                                    className="h-4 w-4 rounded border-zinc-300"
                                />
                                <span className="text-sm text-muted-foreground">Enable sandbox mode</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Active</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formState.active}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, active: e.target.checked }))}
                                    className="h-4 w-4 rounded border-zinc-300"
                                />
                                <span className="text-sm text-muted-foreground">Enable gateway</span>
                            </div>
                        </div>
                    </div>

                    {editingGateway?.api_key !== null && (
                        <PasswordInput
                            label="API Key"
                            value={formState.api_key || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, api_key: e.target.value }))}
                            placeholder="Enter API key"
                        />
                    )}

                    {editingGateway?.secret_key !== null && (
                        <PasswordInput
                            label="Secret Key"
                            value={formState.secret_key || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, secret_key: e.target.value }))}
                            placeholder="Enter secret key"
                        />
                    )}

                    {editingGateway?.secret_hash !== null && (
                        <PasswordInput
                            label="Secret Hash"
                            value={formState.secret_hash || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, secret_hash: e.target.value }))}
                            placeholder="Enter secret hash"
                        />
                    )}

                    {editingGateway?.public_key !== null && (
                        <PasswordInput
                            label="Public Key"
                            value={formState.public_key || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, public_key: e.target.value }))}
                            placeholder="Enter public key"
                        />
                    )}

                    {editingGateway?.contract_code !== null && (
                        <PasswordInput
                            label="Contract Code"
                            value={formState.contract_code || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, contract_code: e.target.value }))}
                            placeholder="Enter contract code"
                        />
                    )}

                    {editingGateway?.client_id !== null && (
                        <Input
                            label="Client ID"
                            value={formState.client_id || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, client_id: e.target.value }))}
                            placeholder="Enter client ID"
                        />
                    )}

                    {editingGateway?.client_secret !== null && (
                        <PasswordInput
                            label="Client Secret"
                            value={formState.client_secret || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, client_secret: e.target.value }))}
                            placeholder="Enter client secret"
                        />
                    )}

                    {editingGateway?.base_url !== null && (
                        <Input
                            label="Base URL"
                            value={formState.base_url || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, base_url: e.target.value }))}
                            placeholder="https://api.example.com"
                            type="url"
                        />
                    )}

                    {editingGateway?.redirect_url !== null && (
                        <Input
                            label="Redirect URL"
                            value={formState.redirect_url || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, redirect_url: e.target.value }))}
                            placeholder="https://example.com/callback"
                            type="url"
                        />
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" isLoading={updateMutation.isPending}>
                            Update Gateway
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setEditModalOpen(false);
                                setEditingGateway(null);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

