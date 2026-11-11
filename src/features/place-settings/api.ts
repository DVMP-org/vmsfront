/**
 * Place settings data access.
 *
 * Components never call the API directly: members come from the workspace
 * service and the resident-editable preferences come from storage until the
 * API exposes a settings resource. When it does, only this file changes.
 */

import { placeWorkspaceApi } from "@/features/place-workspace/api";
import type { WorkspaceRelationship } from "@/types";

export const SETTINGS_TABS = [
    "notifications",
    "visitors",
    "household",
    "privacy",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export type CommunicationChannel = "email" | "sms" | "push";

export interface PlacePreferences {
    /** Visitor arrival alert. */
    visitor_arrival_alert: boolean;
    charge_reminders: boolean;
    maintenance_updates: boolean;
    communication_channel: CommunicationChannel;
    /** Hours an invitation stays valid after the visit window closes. */
    invitation_expiry_hours: number;
    require_visitor_approval: boolean;
    /** Privacy tab. */
    share_movement_log_with_hosts: boolean;
    show_resident_name_to_visitors: boolean;
}

export interface HouseholdMember extends WorkspaceRelationship {
    /** Access level the household member has over invitations. */
    access_level?: HouseholdAccessLevel;
}

export type HouseholdAccessLevel = "full" | "manage_invitations" | "view_only";

export const ACCESS_LEVELS: Array<{
    value: HouseholdAccessLevel;
    label: string;
}> = [
        { value: "full", label: "Full access" },
        { value: "manage_invitations", label: "Manage invitations" },
        { value: "view_only", label: "View only" },
    ];

export const EXPIRY_OPTIONS = [6, 12, 24, 48, 72] as const;

export function defaultPreferences(): PlacePreferences {
    return {
        visitor_arrival_alert: true,
        charge_reminders: true,
        maintenance_updates: true,
        communication_channel: "email",
        invitation_expiry_hours: 24,
        require_visitor_approval: true,
        share_movement_log_with_hosts: false,
        show_resident_name_to_visitors: true,
    };
}

const storageKey = (placeId: string) => `vms:place-preferences:${placeId}`;

function readStored(placeId: string): PlacePreferences | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(storageKey(placeId));
        if (!raw) return null;
        return { ...defaultPreferences(), ...(JSON.parse(raw) as PlacePreferences) };
    } catch {
        return null;
    }
}

export const placeSettingsApi = {
    /** Preferences for one Place, falling back to sensible defaults. */
    preferences: async (placeId: string): Promise<PlacePreferences> =>
        readStored(placeId) ?? defaultPreferences(),
    savePreferences: async (
        placeId: string,
        preferences: PlacePreferences,
    ): Promise<PlacePreferences> => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(storageKey(placeId), JSON.stringify(preferences));
        }
        return preferences;
    },
    /** People attached to the Place, with a derived access level. */
    members: async (placeId: string): Promise<HouseholdMember[]> => {
        const members = await placeWorkspaceApi.members(placeId);
        return members.map((member) => ({
            ...member,
            access_level: accessLevelFor(member.role),
        }));
    },
    addMember: (
        placeId: string,
        body: { display_name: string; email: string; role: string },
    ) => placeWorkspaceApi.addMember(placeId, body),
    removeMember: (placeId: string, relationshipId: string) =>
        placeWorkspaceApi.removeMember(placeId, relationshipId),
};

/** Super admins and admins keep full control of invitations. */
export function accessLevelFor(role?: string | null): HouseholdAccessLevel {
    switch (role) {
        case "resident":
        case "owner":
        case "household_member":
            return "full";
        case "tenant":
        case "member":
            return "manage_invitations";
        default:
            return "view_only";
    }
}
