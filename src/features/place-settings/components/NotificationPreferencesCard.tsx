"use client";

import { Mail, MessageSquare, Smartphone } from "lucide-react";

import { Switch } from "@/components/ui/Switch";
import {
    EXPIRY_OPTIONS,
    type CommunicationChannel,
    type PlacePreferences,
} from "../api";
import {
    SettingsCard,
    SettingsRow,
    SettingsSelect,
} from "./SettingsPrimitives";

const channels: Array<{
    value: CommunicationChannel;
    label: string;
    icon: typeof Mail;
}> = [
        { value: "email", label: "Email", icon: Mail },
        { value: "sms", label: "SMS", icon: MessageSquare },
        { value: "push", label: "Push", icon: Smartphone },
    ];

export function NotificationPreferencesCard({
    preferences,
    email,
    onChange,
}: {
    preferences: PlacePreferences;
    email?: string | null;
    onChange: (patch: Partial<PlacePreferences>) => void;
}) {
    const channel = channels.find(
        (item) => item.value === preferences.communication_channel,
    );
    const ChannelIcon = channel?.icon ?? Mail;

    return (
        <SettingsCard
            title="Notification preferences"
            description="Choose what to be notified about and how to receive updates."
        >
            <SettingsRow
                title="New visitor arrival alert"
                description="Get a notification when an invited visitor checks in."
                control={
                    <Switch
                        id="pref-visitor-arrival"
                        label="New visitor arrival alert"
                        description="Get a notification when an invited visitor checks in."
                        checked={preferences.visitor_arrival_alert}
                        onChange={(next) => onChange({ visitor_arrival_alert: next })}
                    />
                }
            />
            <SettingsRow
                title="Charge due reminders"
                description="Receive reminders before your charges are due."
                control={
                    <Switch
                        id="pref-charge-reminders"
                        label="Charge due reminders"
                        description="Receive reminders before your charges are due."
                        checked={preferences.charge_reminders}
                        onChange={(next) => onChange({ charge_reminders: next })}
                    />
                }
            />
            <SettingsRow
                title="Maintenance updates"
                description="Get status updates on your maintenance requests."
                control={
                    <Switch
                        id="pref-maintenance-updates"
                        label="Maintenance updates"
                        description="Get status updates on your maintenance requests."
                        checked={preferences.maintenance_updates}
                        onChange={(next) => onChange({ maintenance_updates: next })}
                    />
                }
            />
            <SettingsRow
                title="Preferred communication channel"
                description="Where we'll send your notifications and updates."
                htmlFor="pref-channel"
                control={
                    <div className="flex items-center gap-2">
                        <ChannelIcon
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
                        />
                        <SettingsSelect
                            id="pref-channel"
                            ariaLabel="Preferred communication channel"
                            value={preferences.communication_channel}
                            onChange={(value) =>
                                onChange({ communication_channel: value as CommunicationChannel })
                            }
                            options={channels.map((item) => ({
                                value: item.value,
                                label: item.value === "email" && email ? `Email (${email})` : item.label,
                            }))}
                        />
                    </div>
                }
            />
            <SettingsRow
                title="Default invitation expiry"
                description="The default validity period for new invitations."
                htmlFor="pref-expiry"
                control={
                    <SettingsSelect
                        id="pref-expiry"
                        ariaLabel="Default invitation expiry"
                        value={String(preferences.invitation_expiry_hours)}
                        onChange={(value) =>
                            onChange({ invitation_expiry_hours: Number(value) })
                        }
                        options={EXPIRY_OPTIONS.map((hours) => ({
                            value: String(hours),
                            label: `${hours} hours`,
                        }))}
                    />
                }
            />
        </SettingsCard>
    );
}
