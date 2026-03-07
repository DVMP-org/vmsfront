"use client";

import { useState, useEffect, useMemo } from "react";
import { useMailerSettings, useUpdateMailerSettings } from "@/hooks/use-config-settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Loader2, Save, Eye, EyeOff, Server, FileText, Settings, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { UpdateMailerSettingsRequest } from "@/types";
import { cn } from "@/lib/utils";

type MailerSubTab = "smtp" | "templates" | "sender";

interface SubTabConfig {
    id: MailerSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const SUB_TABS: SubTabConfig[] = [
    { id: "smtp", label: "SMTP Credentials", icon: Server },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "sender", label: "Sender Settings", icon: Settings },
];

interface MailerFormState {
    smtp_host: string;
    smtp_port: string;
    smtp_user: string;
    smtp_password: string;
    from_email: string;
}

const initialFormState: MailerFormState = {
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_password: "",
    from_email: "",
};

// Email Status Component
function EmailStatus({ formState }: { formState: MailerFormState }) {
    const isConfigured = useMemo(() => {
        return !!(
            formState.smtp_host.trim() &&
            formState.smtp_port &&
            formState.smtp_user.trim() &&
            formState.smtp_password &&
            formState.from_email.trim()
        );
    }, [formState]);

    const missingFields = useMemo(() => {
        const fields: string[] = [];
        if (!formState.smtp_host.trim()) fields.push("SMTP Host");
        if (!formState.smtp_port) fields.push("SMTP Port");
        if (!formState.smtp_user.trim()) fields.push("SMTP Username");
        if (!formState.smtp_password) fields.push("SMTP Password");
        if (!formState.from_email.trim()) fields.push("From Email");
        return fields;
    }, [formState]);

    if (isConfigured) {
        return (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                        Email Sending Enabled
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Your SMTP configuration is complete. Emails can be sent from this platform.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Email Sending Disabled
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Complete the following to enable email sending:
                </p>
                <ul className="text-xs text-amber-600 dark:text-amber-400 mt-1 list-disc list-inside">
                    {missingFields.map((field) => (
                        <li key={field}>{field}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// SMTP Credentials Tab Content
function SmtpCredentialsTab({
    formState,
    setFormState,
    showPassword,
    setShowPassword,
    hasChanges,
    setHasChanges,
    updateSettings,
}: {
    formState: MailerFormState;
    setFormState: React.Dispatch<React.SetStateAction<MailerFormState>>;
    showPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    hasChanges: boolean;
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
    updateSettings: ReturnType<typeof useUpdateMailerSettings>;
}) {
    const handleInputChange = (field: keyof MailerFormState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const data: UpdateMailerSettingsRequest = {
            smtp_host: formState.smtp_host.trim(),
            smtp_port: parseInt(formState.smtp_port, 10) || 587,
            smtp_user: formState.smtp_user.trim() || null,
            smtp_password: formState.smtp_password || null,
            from_email: formState.from_email.trim() || null,
        };

        updateSettings.mutate(data, {
            onSuccess: () => {
                setHasChanges(false);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 space-y-5">
                {/* SMTP Host */}
                <div className="space-y-2">
                    <label htmlFor="smtp_host" className="text-sm font-medium text-foreground">
                        SMTP Host <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="smtp_host"
                        type="text"
                        placeholder="smtp.example.com"
                        value={formState.smtp_host}
                        onChange={(e) => handleInputChange("smtp_host", e.target.value)}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        The hostname of your SMTP server (e.g., smtp.gmail.com, smtp.sendgrid.net)
                    </p>
                </div>

                {/* SMTP Port */}
                <div className="space-y-2">
                    <label htmlFor="smtp_port" className="text-sm font-medium text-foreground">
                        SMTP Port <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="smtp_port"
                        type="number"
                        placeholder="587"
                        value={formState.smtp_port}
                        onChange={(e) => handleInputChange("smtp_port", e.target.value)}
                        min={1}
                        max={65535}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
                    </p>
                </div>

                {/* SMTP User */}
                <div className="space-y-2">
                    <label htmlFor="smtp_user" className="text-sm font-medium text-foreground">
                        SMTP Username <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="smtp_user"
                        type="text"
                        placeholder="your-username@example.com"
                        value={formState.smtp_user}
                        onChange={(e) => handleInputChange("smtp_user", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        The username for SMTP authentication (often your email address)
                    </p>
                </div>

                {/* SMTP Password */}
                <div className="space-y-2">
                    <label htmlFor="smtp_password" className="text-sm font-medium text-foreground">
                        SMTP Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Input
                            id="smtp_password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formState.smtp_password}
                            onChange={(e) => handleInputChange("smtp_password", e.target.value)}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        The password or app-specific password for SMTP authentication
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={!hasChanges || updateSettings.isPending || !formState.smtp_host || !formState.smtp_port}
                >
                    {updateSettings.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save SMTP Settings
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

// Templates Tab Content (Placeholder)
function TemplatesTab() {
    return (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
            <div className="text-center py-8">
                <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Email Templates</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Customize email templates for notifications, welcome emails, password resets, and more.
                    This feature is coming soon.
                </p>
            </div>
        </div>
    );
}

// Sender Settings Tab Content
function SenderSettingsTab({
    formState,
    setFormState,
    hasChanges,
    setHasChanges,
    updateSettings,
}: {
    formState: MailerFormState;
    setFormState: React.Dispatch<React.SetStateAction<MailerFormState>>;
    hasChanges: boolean;
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
    updateSettings: ReturnType<typeof useUpdateMailerSettings>;
}) {
    const handleInputChange = (field: keyof MailerFormState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const data: UpdateMailerSettingsRequest = {
            smtp_host: formState.smtp_host.trim(),
            smtp_port: parseInt(formState.smtp_port, 10) || 587,
            smtp_user: formState.smtp_user.trim() || null,
            smtp_password: formState.smtp_password || null,
            from_email: formState.from_email.trim() || null,
        };

        updateSettings.mutate(data, {
            onSuccess: () => {
                setHasChanges(false);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 space-y-5">
                {/* From Email */}
                <div className="space-y-2">
                    <label htmlFor="from_email" className="text-sm font-medium text-foreground">
                        From Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="from_email"
                        type="email"
                        placeholder="noreply@example.com"
                        value={formState.from_email}
                        onChange={(e) => handleInputChange("from_email", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        The email address that will appear as the sender for all outgoing emails
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={!hasChanges || updateSettings.isPending}
                >
                    {updateSettings.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Sender Settings
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

export function MailerSettingsSection() {
    const [activeSubTab, setActiveSubTab] = useState<MailerSubTab>("smtp");
    const [formState, setFormState] = useState<MailerFormState>(initialFormState);
    const [showPassword, setShowPassword] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const { data: settings, isLoading } = useMailerSettings();
    const updateSettings = useUpdateMailerSettings();

    // Populate form with existing settings
    useEffect(() => {
        if (settings) {
            setFormState({
                smtp_host: settings.smtp_host || "",
                smtp_port: settings.smtp_port?.toString() || "587",
                smtp_user: settings.smtp_user || "",
                smtp_password: settings.smtp_password || "",
                from_email: settings.from_email || "",
            });
            setHasChanges(false);
        }
    }, [settings]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-zinc-600" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">Mailer Settings</h2>
                    <p className="text-sm text-muted-foreground">
                        Configure SMTP settings for sending emails from your platform.
                    </p>
                </div>
            </div>

            {/* Email Status */}
            <EmailStatus formState={formState} />

            {/* Main Content with Side Tabs */}
            <div className="flex gap-6">
                {/* Side Tabs */}
                <div className="w-48 flex-shrink-0">
                    <nav className="space-y-1">
                        {SUB_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeSubTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveSubTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))] border-l-2 border-[rgb(var(--brand-primary))]"
                                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 max-w-2xl">
                    {activeSubTab === "smtp" && (
                        <SmtpCredentialsTab
                            formState={formState}
                            setFormState={setFormState}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            hasChanges={hasChanges}
                            setHasChanges={setHasChanges}
                            updateSettings={updateSettings}
                        />
                    )}
                    {activeSubTab === "templates" && <TemplatesTab />}
                    {activeSubTab === "sender" && (
                        <SenderSettingsTab
                            formState={formState}
                            setFormState={setFormState}
                            hasChanges={hasChanges}
                            setHasChanges={setHasChanges}
                            updateSettings={updateSettings}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
