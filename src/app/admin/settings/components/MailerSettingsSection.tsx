"use client";

import { useState, useEffect } from "react";
import { useMailerSettings, useUpdateMailerSettings } from "@/hooks/use-config-settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { UpdateMailerSettingsRequest } from "@/types";

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

export function MailerSettingsSection() {
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div className=" border border-zinc-200 rounded-lg p-6 space-y-5">
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
                            SMTP Username
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
                            SMTP Password
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

                    {/* From Email */}
                    <div className="space-y-2">
                        <label htmlFor="from_email" className="text-sm font-medium text-foreground">
                            From Email
                        </label>
                        <Input
                            id="from_email"
                            type="email"
                            placeholder="noreply@example.com"
                            value={formState.from_email}
                            onChange={(e) => handleInputChange("from_email", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            The email address that will appear as the sender
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
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </form >
        </div >
    );
}
