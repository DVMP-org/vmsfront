import { ComponentType } from "react";

export interface PluginRoute {
    path: string;
    component: ComponentType;
    auth?: boolean;
}

export interface PluginManifest {
    name: string;
    title: string;
    version?: string;
    icon?: string;
    frontend: {
        basePath: string;
        routes?: Array<{
            path: string;
            component: string;
            title: string;
            icon?: string;
        }>;
        menu?: {
            label: string;
            icon?: string;
        };
    };
}

export interface FrontendPlugin {
    manifest: PluginManifest;
    routes: PluginRoute[];
}

export interface LoadedPlugin {
    name: string;
    basePath: string;
    manifest: PluginManifest;
    routes: PluginRoute[];
}
