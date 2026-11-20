"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Party-workspace pages contributed by plugins.
 *
 * The host renders a section only when the plugin is active on the Place's Site
 * (the server decides that in `plugin_navigation`); this registry only says which
 * component owns the section.
 */
export const PARTY_PLUGIN_SECTIONS: Record<
    string,
    Record<string, ComponentType>
> = {
    electricity: {
        electricity: dynamic(
            () => import("./electricity/pages/party/ElectricityPartyPage"),
        ),
    },
};

export function partyPluginSection(
    plugin: string,
    section: string,
): ComponentType | null {
    return PARTY_PLUGIN_SECTIONS[plugin]?.[section] ?? null;
}
