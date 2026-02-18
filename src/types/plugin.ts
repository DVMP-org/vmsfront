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
export interface PluginConfig {
    [key: string]: any;
}

export interface PluginDetails {
    configEndpoint: string | null;
    documentationUrl: string | null;
    useCases: string[];
    setupSteps: string[];
    requirements: string[];
    configOptions: {
        key: string;
        label: string;
        type: "text" | "toggle" | "select" | "number" | "boolean";
        description: string;
        defaultValue?: any;
        options?: string[];
    }[];
}

export interface BackendPlugin {
    id: string;
    name: string;
    version: string;
    enabled: boolean;
    description?: string;
    category?: string;
    image?: string;
    details?: PluginDetails;
    [key: string]: any;
    configuration?: PluginConfig; // Current configuration from backend
    configured?: boolean; // Whether the plugin has been configured at least once
}

// Plugin type definition (for UI display)
export interface Plugin {
    id: string;
    name: string;
    title: string;
    description: string;
    icon: any;
    enabled: boolean;
    category: string;
    image?: string;
    color: string;
    details: PluginDetails;
    config: PluginConfig;
    backendVersion?: string;
    frontendVersion?: string;
    hasFrontend?: boolean; // Whether frontend plugin exists
    configuration?: PluginConfig; // Current configuration from backend
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

// Marketplace Plugin Types
export interface MarketplacePlugin {
    id: string;
    name: string;
    slug: string;
    description: string;
    version: string;
    category: string;
    author: string;
    image?: string;
    screenshots?: string[];
    details?: PluginDetails;
    price: number; // 0 for free
    currency?: string;
    rating: number; // 0-5
    review_count: number;
    installed_count: number;
    installed: boolean;
    enabled?: boolean;
    tags?: string[];
    requirements?: string[];
    features?: string[];
    documentationUrl?: string;
    supportUrl?: string;
    lastUpdated?: string;
    createdAt?: string;
}

export interface MarketplaceCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    pluginCount: number;
    icon?: string;
}

export interface InstallPluginResponse {
    success: boolean;
    message: string;
    plugin?: BackendPlugin;
}
