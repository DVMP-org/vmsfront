"use client";

import { Lock } from "lucide-react";

import { Switch } from "@/components/ui/Switch";
import type { PlacePreferences } from "../api";
import { SettingsCard, SettingsRow } from "./SettingsPrimitives";

export function VisitorPreferencesCard({
    preferences,
    siteName,
    onChange,
}: {
    preferences: PlacePreferences;
    siteName: string;
    onChange: (patch: Partial<PlacePreferences>) => void;
}) {
    return (
        <SettingsCard
            title="Visitor preferences"
            description="How visitors are approved and expected at this Place."
        >
            <SettingsRow
                title="Require visitor approval"
                description="Visitors must be approved by a household member before they can check in."
                control={
                    <Switch
                        id="pref-require-approval"
                        label="Require visitor approval"
                        description="Visitors must be approved by a household member before they can check in."
                        checked={preferences.require_visitor_approval}
                        onChange={(next) => onChange({ require_visitor_approval: next })}
                    />
                }
                hint={
                    <>
                        <Lock aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>Subject to site policy. This may be enforced by {siteName}.</span>
                    </>
                }
            />
        </SettingsCard>
    );
}
