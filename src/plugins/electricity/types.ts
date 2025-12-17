import { ComponentType } from "react";

export interface PluginRoute {
    path: string;
    component: ComponentType;
    auth?: boolean;
}

export interface PluginManifest {
    name: string;
    title: string;
    frontend: {
        basePath: string;
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
