import { ComponentType } from "react";

export interface PluginRoute {
    path: string;
    component: ComponentType;
    title?: string; // Display title for sidebar navigation
    icon?: string; // Icon name (e.g., "zap", "credit-card")
    auth?: boolean;
}

export type PluginUserType = "admin" | "resident" | "both";

export interface PluginManifestRoute {
    path: string;
    component: string;
    title: string;
    icon?: string;
    userType?: PluginUserType; // Optional: defaults to "both" if not specified
}

export interface PluginManifest {
    name: string;
    title: string;
    version?: string;
    backendVersion?: string; // Version from backend API
    icon?: string;
    frontend: {
        basePath: string;
        // Routes are now defined in routes.js, not in manifest
        // Keeping these for backward compatibility only
        routes?: PluginManifestRoute[];
        admin?: {
            routes?: PluginManifestRoute[];
        };
        resident?: {
            routes?: PluginManifestRoute[];
        };
        menu?: {
            label: string;
            icon?: string;
        };
    };
}

export interface FrontendPlugin {
    manifest: PluginManifest;
    // Legacy: routes for backward compatibility
    routes?: PluginRoute[];
    // New: separate routes for admin and resident
    adminRoutes?: PluginRoute[];
    residentRoutes?: PluginRoute[];
}

export interface LoadedPlugin {
    name: string;
    basePath: string;
    manifest: PluginManifest;
    // Legacy: routes for backward compatibility
    routes?: PluginRoute[];
    // New: separate routes for admin and resident
    adminRoutes?: PluginRoute[];
    residentRoutes?: PluginRoute[];
    // Backend plugin ID for enable/disable operations
    backendId?: string;
}
