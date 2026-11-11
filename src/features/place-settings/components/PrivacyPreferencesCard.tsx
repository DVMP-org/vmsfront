"use client";

import { Switch } from "@/components/ui/Switch";
import type { PlacePreferences } from "../api";
import { SettingsCard, SettingsRow } from "./SettingsPrimitives";

export function PrivacyPreferencesCard({
    preferences,
    onChange,
}: {
    preferences: PlacePreferences;
    onChange: (patch: Partial<PlacePreferences>) => void;
}) {
    return (
        <SettingsCard
            title="Privacy"
            description="Control what other people at this Place can see about you."
        >
            <SettingsRow
                title="Share my movement log with hosts"
                description="Hosts can see when you enter and leave Pebble Court."
                control={
                    <Switch
                        id="pref-share-movements"
                        label="Share my movement log with hosts"
                        checked={preferences.share_movement_log_with_hosts}
                        onChange={(next) => onChange({ share_movement_log_with_hosts: next })}
                    />
                }
            />
            <SettingsRow
                title="Show my name to visitors"
                description="Your name appears on invitations you send."
                control={
                    <Switch
                        id="pref-show-name"
                        label="Show my name to visitors"
                        checked={preferences.show_resident_name_to_visitors}
                        onChange={(next) =>
                            onChange({ show_resident_name_to_visitors: next })
                        }
                    />
                }
            />
        </SettingsCard>
    );
}
