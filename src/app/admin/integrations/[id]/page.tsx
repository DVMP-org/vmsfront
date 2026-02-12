"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationService } from "@/services/integration-service";
import {
    Integration,
    CredentialFormValues,
    IntegrationCredentials,
    INTEGRATION_TYPE_LABELS,
    INTEGRATION_CAPABILITY_LABELS,
} from "@/types/integration";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
    CredentialFormRenderer,
    IntegrationStatusToggle,
    IntegrationTypeBadge,
} from "../components";
import {
    ArrowLeft,
    ExternalLink,
    FileText,
    Save,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Settings,
    Info,
    Zap,
} from "lucide-react";
import { useDisableIntegration, useEnableIntegration, useIntegration, useUpdateIntegration, useUpdateIntegrationCredentials } from "@/hooks/use-integrations";
import { titleCase } from "@/lib/utils";

export default function IntegrationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const integrationId = params?.id as string;

    const [credentialValues, setCredentialValues] = useState<CredentialFormValues>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch integration details
    const {
        data: integrationData,
        isLoading,
        error,
    } = useIntegration(integrationId);

    const integration = integrationData;

    // Initialize credential values when data loads
    useEffect(() => {
        if (integration?.config?.credentials) {
            // Initialize with defaults
            const defaults: CredentialFormValues = {};
            Object.entries(integration.config.credentials).forEach(([key, field]) => {

                if (field.value !== undefined) {
                    defaults[key] = field.value;
                }
            });
            setCredentialValues(defaults);
        }
    }, [integration]);

    // Enable mutation
    const enableMutation = useEnableIntegration(integrationId);
    // Disable mutation
    const disableMutation = useDisableIntegration(integrationId)
    // Update integration mutation
    const updateMutation = useUpdateIntegrationCredentials(integrationId);

    // Health check mutation
    const healthCheckMutation = useMutation({
        mutationFn: async () => {
            if (!integration) throw new Error("Integration not found");
            return integrationService.checkHealth(integration.name);
        },
        onSuccess: (response) => {
            if (response.data.status === "healthy") {
                toast.success(response.data.message || "Connection healthy");
            } else {
                toast.error(response.data.message || "Connection unhealthy");
            }
        },
        onError: (error: any) => {
            toast.error(error?.message || "Health check failed");
        },
    });

    const handleCredentialChange = (key: string, value: string | number | boolean) => {
        setCredentialValues((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
        // Clear error for this field
        if (errors[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const validateCredentials = (): boolean => {
        if (!integration?.config?.credentials) return true;

        const newErrors: Record<string, string> = {};
        Object.entries(integration.config.credentials).forEach(([key, field]) => {
            const isRequired = field.required !== false;
            const value = credentialValues[key];

            if (isRequired && (value === undefined || value === "" || value === null)) {
                newErrors[key] = "This field is required";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveCredentials = () => {
        if (!validateCredentials()) {
            toast.error("Please fill in all required fields");
            return;
        }

        const updatedCredentials: IntegrationCredentials = {};

        if (integration?.config?.credentials) {
            Object.entries(integration.config.credentials).forEach(([key, field]) => {
                updatedCredentials[key] = {
                    ...field,
                    value: credentialValues[key]
                };
            });
        }

        updateMutation.mutate(updatedCredentials);
    };

    const handleToggle = () => {
        if (!integration) return;

        if (!integration.enabled && !integration.credentials_configured) {
            toast.error("Please configure credentials before enabling");
            return;
        }

        if (integration.enabled) {
            disableMutation.mutate();
        } else {
            enableMutation.mutate();
        }
    };

    const isToggling = enableMutation.isPending || disableMutation.isPending;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error || !integration) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => router.push("/admin/integrations")}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Integrations
                </button>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
                    <h2 className="text-lg font-semibold text-foreground">Integration Not Found</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        This integration may not exist or you don&apos;t have access to it.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => router.push("/admin/integrations")}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Integrations
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Logo & Info */}
                <div className="flex items-start gap-4 flex-1">
                    {integration?.config?.logo_url ? (
                        <img
                            src={integration?.config?.logo_url}
                            alt={integration.name}
                            className="h-14 w-14 rounded-lg object-contain bg-muted p-1"
                        />
                    ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-xl font-semibold text-muted-foreground">
                                {titleCase(integration.name)}
                            </span>
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-xl font-semibold text-foreground">{integration.name}</h1>
                            {integration.version && (
                                <Badge variant="secondary" className="text-xs">
                                    v{integration.version}
                                </Badge>
                            )}
                            <IntegrationTypeBadge type={integration.provider} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {integration?.config?.description}
                        </p>
                        {/* External Links */}
                        <div className="flex items-center gap-4 mt-2">
                            {integration?.config?.website_url && (
                                <a
                                    href={integration?.config?.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Website
                                </a>
                            )}
                            {integration?.config?.docs_url && (
                                <a
                                    href={integration?.config?.docs_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <FileText className="h-3 w-3" />
                                    Docs
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-4 p-4 border border-zinc-200 rounded-lg bg-muted/30">
                    <div className="pr-4 border-r border-zinc-200">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                        <IntegrationStatusToggle
                            enabled={integration.enabled}
                            onToggle={handleToggle}
                            disabled={isToggling || (!integration.credentials_configured && !integration.enabled)}
                            showLabel
                            size="md"
                        />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Configuration
                        </p>
                        {integration.credentials_configured ? (
                            <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Configured
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-sm text-amber-600">
                                <AlertCircle className="h-4 w-4" />
                                Needs Setup
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content - Credentials Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="pb-4 border-b border-zinc-200">
                            <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-base">Credentials Configuration</CardTitle>
                            </div>
                            <CardDescription>
                                Configure the credentials required for this integration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <CredentialFormRenderer
                                credentials={integration?.config?.credentials}
                                values={credentialValues}
                                onChange={handleCredentialChange}
                                errors={errors}
                                disabled={updateMutation.isPending}
                            />

                            {/* Save Button */}
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => healthCheckMutation.mutate()}
                                    disabled={healthCheckMutation.isPending}
                                    leftNode={
                                        healthCheckMutation.isPending ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        )
                                    }
                                >
                                    Check Health
                                </Button>

                                <Button
                                    onClick={handleSaveCredentials}
                                    disabled={!hasChanges || updateMutation.isPending}
                                    isLoading={updateMutation.isPending}
                                    leftNode={<Save className="h-3.5 w-3.5" />}
                                >
                                    Save Credentials
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Integration Info */}
                    <Card>
                        <CardHeader className="pb-3 border-b border-zinc-200">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-base">Details</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                    Type
                                </p>
                                <p className="text-sm font-medium">
                                    {INTEGRATION_TYPE_LABELS[integration.provider]}
                                </p>
                            </div>

                            {integration.last_synced_at && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                        Last Synced
                                    </p>
                                    <p className="text-sm">
                                        {new Date(integration.last_synced_at).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {integration.created_at && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                        Added
                                    </p>
                                    <p className="text-sm">
                                        {new Date(integration.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            )}

                            {integration.updated_at && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                        Last Updated
                                    </p>
                                    <p className="text-sm">
                                        {new Date(integration.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Capabilities */}
                    {integration?.config?.capabilities && integration?.config?.capabilities.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3 border-b border-zinc-200">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-base">Capabilities</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ul className="space-y-2">
                                    {integration?.config?.capabilities?.map((capability) => (
                                        <li
                                            key={capability}
                                            className="flex items-center gap-2 text-sm text-muted-foreground"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            {INTEGRATION_CAPABILITY_LABELS[capability] || capability}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
