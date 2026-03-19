"use client";

import { useState, useMemo } from "react";
import {
    Mail,
    MessageSquare,
    MessageCircle,
    BellRing,
    Bell,
    Loader2,
    CheckCircle2,
    XCircle,
    Settings,
    ExternalLink,
    PowerOff,
    Save,
    ArrowLeft,
    Eye,
    EyeOff,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
    NotificationChannelType,
    NotificationProvider,
    ProviderCredentialField,
    NOTIFICATION_CHANNELS,
    getChannelDefinition,
    parseCredentialSchema,
} from "@/types/notification-channel";
import {
    useNotificationProviders,
    useActivateProvider,
    useUpdateProviderCredentials,
    useDeactivateProvider,
} from "@/hooks/use-notification-channels";

// ── Icon Mapping ──────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<NotificationChannelType, React.ComponentType<{ className?: string }>> = {
    email: Mail,
    sms: MessageSquare,
    whatsapp: MessageCircle,
    push: BellRing,
};

// ── Provider Credential Form ──────────────────────────────────────────

function ProviderCredentialForm({
    fields,
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting,
    submitLabel,
}: {
    fields: ProviderCredentialField[];
    initialValues?: Record<string, string | number | boolean | null> | null;
    onSubmit: (values: Record<string, string | number | boolean | null>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    submitLabel?: string;
}) {
    const [values, setValues] = useState<Record<string, string | number | boolean | null>>(() => {
        const init: Record<string, string | number | boolean | null> = {};
        fields.forEach((field) => {
            init[field.key] = initialValues?.[field.key] ?? (field.type === "boolean" ? false : "");
        });
        return init;
    });
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    const handleChange = (key: string, value: string | number | boolean) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const togglePassword = (key: string) => {
        setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const isValid = fields
        .filter((f) => f.required)
        .every((f) => {
            const val = values[f.key];
            return val !== null && val !== undefined && String(val).trim() !== "";
        });

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(values);
    };

    const renderField = (field: ProviderCredentialField) => {
        const value = values[field.key] ?? "";

        if (field.type === "select" && field.options) {
            return (
                <select
                    value={String(value)}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/50"
                >
                    <option value="">Select...</option>
                    {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }

        if (field.type === "password") {
            return (
                <div className="relative">
                    <Input
                        type={showPasswords[field.key] ? "text" : "password"}
                        placeholder={field.placeholder}
                        value={String(value)}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => togglePassword(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                        {showPasswords[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            );
        }

        if (field.type === "boolean") {
            const checked = Boolean(value);
            return (
                <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    onClick={() => handleChange(field.key, !checked)}
                    className={cn(
                        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/50 focus:ring-offset-2 mx-2",
                        checked ? "bg-[rgb(var(--brand-primary))]" : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                >
                    <span
                        className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            checked ? "translate-x-4" : "translate-x-0"
                        )}
                    />
                </button>
            );
        }

        return (
            <Input
                type={field.type.includes("number") || field.type.includes("integer") ? "number" : "text"}
                placeholder={field.placeholder}
                value={String(value)}
                onChange={(e) => handleChange(field.key, e.target.value)}
            />
        );
    };

    if (fields.length === 0) {
        return (
            <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    This provider does not require any credentials to configure.
                </p>
                <div className="flex items-center justify-center gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit({})} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {submitLabel || "Activate"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 space-y-4">
                {fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderField(field)}
                        {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!isValid || isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            {submitLabel || "Save Configuration"}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

// ── Provider Card ─────────────────────────────────────────────────────

function ProviderCard({
    provider,
    onConfigure,
    onDeactivate,
    isDeactivating,
}: {
    provider: NotificationProvider;
    onConfigure: (provider: NotificationProvider) => void;
    onDeactivate: (providerId: string) => void;
    isDeactivating: boolean;
}) {
    return (
        <div
            className={cn(
                "border rounded-lg p-4 transition-all",
                provider.enabled
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {provider.logo_url && (
                        <img
                            src={provider.logo_url}
                            alt={provider.display_name}
                            className="h-8 w-8 rounded object-contain flex-shrink-0"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-foreground">{provider.display_name}</h4>
                            {provider.enabled && (
                                <Badge variant="success" className="text-[10px] px-1.5 py-0">Active</Badge>
                            )}
                            {provider.configured && !provider.enabled && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Configured</Badge>
                            )}
                        </div>
                        {provider.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {provider.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 ml-3">
                    {provider.enabled ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                        <XCircle className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex-wrap">
                {provider.enabled ? (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onConfigure(provider)}
                            className="text-xs h-7 px-2.5"
                        >
                            <Settings className="h-3 w-3 mr-1" />
                            Edit Credentials
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDeactivate(provider.id)}
                            disabled={isDeactivating}
                            className="text-xs h-7 px-2.5 text-amber-600 hover:text-amber-700 border-amber-200 hover:border-amber-300"
                        >
                            {isDeactivating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <PowerOff className="h-3 w-3 mr-1" />
                            )}
                            Deactivate
                        </Button>
                    </>
                ) : (
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onConfigure(provider)}
                        className="text-xs h-7 px-2.5"
                    >
                        <Zap className="h-3 w-3 mr-1" />
                        Activate
                    </Button>
                )}
            </div>
        </div>
    );
}

// ── Channel Provider List ─────────────────────────────────────────────

function ChannelProviderList({
    channelType,
    providers,
    onConfigure,
    onDeactivate,
    isDeactivating,
}: {
    channelType: NotificationChannelType;
    providers: NotificationProvider[];
    onConfigure: (provider: NotificationProvider) => void;
    onDeactivate: (providerId: string) => void;
    isDeactivating: boolean;
}) {
    const channelDef = getChannelDefinition(channelType);
    if (!channelDef) return null;

    const channelProviders = providers.filter((p) => p.channel === channelType);
    const activeProvider = channelProviders.find((p) => p.enabled);

    return (
        <div className="space-y-5">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    {(() => {
                        const Icon = CHANNEL_ICONS[channelType];
                        return <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />;
                    })()}
                    <h3 className="text-base font-semibold text-foreground">{channelDef.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{channelDef.description}</p>
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                        {channelProviders.length} provider{channelProviders.length !== 1 ? "s" : ""} available
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                        {activeProvider ? (
                            <>Active: <span className="font-medium text-emerald-600">{activeProvider.display_name}</span></>
                        ) : (
                            "No active provider"
                        )}
                    </span>
                </div>
            </div>

            {channelProviders.length > 0 ? (
                <div className="grid gap-3">
                    {channelProviders.map((provider) => (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            onConfigure={onConfigure}
                            onDeactivate={onDeactivate}
                            isDeactivating={isDeactivating}
                        />
                    ))}
                </div>
            ) : (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-8 text-center">
                    <div className="mx-auto mb-3">
                        {(() => {
                            const Icon = CHANNEL_ICONS[channelType];
                            return <Icon className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto" />;
                        })()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        No providers available for this channel yet.
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Configure / Activate Provider View ────────────────────────────────

function ConfigureProviderView({
    provider,
    onBack,
}: {
    provider: NotificationProvider;
    onBack: () => void;
}) {
    const activateProvider = useActivateProvider();
    const updateCredentials = useUpdateProviderCredentials();

    const isUpdate = provider.enabled;

    // Convert the backend dict schema into form-friendly array
    const formFields = useMemo(
        () => parseCredentialSchema(provider.credential_schema),
        [provider.credential_schema]
    );

    const handleSubmit = (values: Record<string, string | number | boolean | null>) => {
        if (isUpdate) {
            updateCredentials.mutate(
                { providerId: provider.id, data: { credentials: values } },
                { onSuccess: () => onBack() }
            );
        } else {
            activateProvider.mutate(
                { provider_id: provider.id, credentials: values },
                { onSuccess: () => onBack() }
            );
        }
    };

    const channelType = provider.channel;

    return (
        <div className="space-y-5">
            <div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to providers
                </button>
                <div className="flex items-center gap-3">
                    {provider.logo_url ? (
                        <img
                            src={provider.logo_url}
                            alt={provider.display_name}
                            className="h-10 w-10 rounded object-contain"
                        />
                    ) : (
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            {(() => {
                                const Icon = CHANNEL_ICONS[channelType];
                                return <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />;
                            })()}
                        </div>
                    )}
                    <div>
                        <h3 className="text-base font-semibold text-foreground">
                            {isUpdate ? "Update Credentials" : "Activate"} — {provider.display_name}
                        </h3>
                        {provider.description && (
                            <p className="text-xs text-muted-foreground">{provider.description}</p>
                        )}
                        {!isUpdate && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Activating this provider will deactivate any currently active provider for this channel.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <ProviderCredentialForm
                fields={formFields}
                initialValues={provider.configured ? provider.config?.credentials : undefined}
                onSubmit={handleSubmit}
                onCancel={onBack}
                isSubmitting={activateProvider.isPending || updateCredentials.isPending}
                submitLabel={isUpdate ? "Update Credentials" : "Activate Provider"}
            />
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────

export function NotificationSettingsSection() {
    const [activeChannel, setActiveChannel] = useState<NotificationChannelType>("email");
    const [configuringProvider, setConfiguringProvider] = useState<NotificationProvider | null>(null);

    const { data: providers = [], isLoading } = useNotificationProviders();

    const deactivateProvider = useDeactivateProvider();

    const channelCounts = useMemo(() => {
        const counts: Record<NotificationChannelType, { total: number; active: number }> = {
            email: { total: 0, active: 0 },
            sms: { total: 0, active: 0 },
            whatsapp: { total: 0, active: 0 },
            push: { total: 0, active: 0 },
        };
        providers.forEach((p) => {
            if (counts[p.channel]) {
                counts[p.channel].total++;
                if (p.enabled) counts[p.channel].active++;
            }
        });
        return counts;
    }, [providers]);

    const handleConfigure = (provider: NotificationProvider) => {
        setConfiguringProvider(provider);
    };

    const handleBack = () => {
        setConfiguringProvider(null);
    };

    const handleDeactivate = (providerId: string) => {
        if (window.confirm("Are you sure you want to deactivate this provider?")) {
            deactivateProvider.mutate(providerId);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                    <Bell className="h-5 w-5 text-zinc-600" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">Notification Channels</h2>
                    <p className="text-sm text-muted-foreground">
                        Configure how notifications are delivered to your users across different channels.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {NOTIFICATION_CHANNELS.map((channelDef) => {
                    const Icon = CHANNEL_ICONS[channelDef.type];
                    const counts = channelCounts[channelDef.type];
                    return (
                        <button
                            key={channelDef.type}
                            onClick={() => {
                                setActiveChannel(channelDef.type);
                                setConfiguringProvider(null);
                            }}
                            className={cn(
                                "flex flex-col p-3 rounded-lg border transition-all text-left",
                                activeChannel === channelDef.type
                                    ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]/5 ring-1 ring-[rgb(var(--brand-primary))]/20"
                                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <Icon className={cn(
                                    "h-4 w-4",
                                    activeChannel === channelDef.type
                                        ? "text-[rgb(var(--brand-primary))]"
                                        : "text-zinc-500"
                                )} />
                                <span className={cn(
                                    "text-sm font-medium",
                                    activeChannel === channelDef.type
                                        ? "text-[rgb(var(--brand-primary))]"
                                        : "text-foreground"
                                )}>
                                    {channelDef.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {counts.active > 0 ? (
                                    <Badge variant="success" className="text-[10px] px-1.5 py-0">
                                        {counts.active} active
                                    </Badge>
                                ) : counts.total > 0 ? (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        Not active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        No providers
                                    </Badge>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-6">
                <div className="w-48 flex-shrink-0 hidden sm:block">
                    <nav className="space-y-1">
                        {NOTIFICATION_CHANNELS.map((channelDef) => {
                            const Icon = CHANNEL_ICONS[channelDef.type];
                            const isActive = activeChannel === channelDef.type;
                            const counts = channelCounts[channelDef.type];

                            return (
                                <button
                                    key={channelDef.type}
                                    onClick={() => {
                                        setActiveChannel(channelDef.type);
                                        setConfiguringProvider(null);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "bg-[rgb(var(--brand-primary)/0.10)] text-[rgb(var(--brand-primary))] "
                                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon className="h-4 w-4" />
                                        <span>{channelDef.label}</span>
                                    </div>
                                    {counts.active > 0 && (
                                        <span className={cn(
                                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                                            isActive
                                                ? "bg-[rgb(var(--brand-primary))]/20 text-[rgb(var(--brand-primary))]"
                                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                                        )}>
                                            {counts.active}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex-1 min-w-0 max-w-2xl">
                    {configuringProvider ? (
                        <ConfigureProviderView
                            provider={configuringProvider}
                            onBack={handleBack}
                        />
                    ) : (
                        <ChannelProviderList
                            channelType={activeChannel}
                            providers={providers}
                            onConfigure={handleConfigure}
                            onDeactivate={handleDeactivate}
                            isDeactivating={deactivateProvider.isPending}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}