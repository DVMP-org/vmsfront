import electricity from "@/plugins/electricity";
import { isPluginPath } from "./plugin-utils";
import type { LoadedPlugin, PluginRoute } from "@/types/plugin";

/**
 * All frontend plugins registered here
 * 
 * To add a new plugin:
 * 1. Create a plugin directory in src/plugins/
 * 2. Export manifest.json and routes.js
 * 3. Import and add to this array
 * 
 * @example
 * ```typescript
 * import myPlugin from "@/plugins/my-plugin";
 * const PLUGINS = [electricity, myPlugin];
 * ```
 */
const PLUGINS = [electricity];

/**
 * Validates a plugin structure
 */
function validatePlugin(plugin: any): plugin is {
    manifest: any;
    routes?: any[];
    adminRoutes?: any[];
    residentRoutes?: any[]
} {
    if (!plugin) {
        console.error("Plugin is null or undefined");
        return false;
    }

    if (!plugin.manifest) {
        console.error("Plugin missing manifest");
        return false;
    }

    if (!plugin.manifest.name) {
        console.error("Plugin manifest missing name");
        return false;
    }

    if (!plugin.manifest.frontend) {
        console.error(`Plugin ${plugin.manifest.name} missing frontend config`);
        return false;
    }

    if (!plugin.manifest.frontend.basePath) {
        console.error(`Plugin ${plugin.manifest.name} missing basePath`);
        return false;
    }

    // Check if plugin has at least one route type
    const hasLegacyRoutes = Array.isArray(plugin.routes) && plugin.routes.length > 0;
    const hasAdminRoutes = Array.isArray(plugin.adminRoutes) && plugin.adminRoutes.length > 0;
    const hasResidentRoutes = Array.isArray(plugin.residentRoutes) && plugin.residentRoutes.length > 0;

    if (!hasLegacyRoutes && !hasAdminRoutes && !hasResidentRoutes) {
        console.warn(`Plugin ${plugin.manifest.name} has no routes defined`);
    }

    return true;
}

/**
 * Loads all registered plugins with validation
 * @returns Array of loaded plugins with normalized data
 */
export function loadPlugins(): LoadedPlugin[] {
    return PLUGINS
        .filter(validatePlugin)
        .map(plugin => {
            // Normalize basePath to always start with /
            const basePath = plugin.manifest.frontend.basePath.startsWith("/")
                ? plugin.manifest.frontend.basePath
                : `/${plugin.manifest.frontend.basePath}`;

            return {
                name: plugin.manifest.name,
                basePath,
                manifest: plugin.manifest,
                // Legacy routes for backward compatibility
                routes: plugin.routes,
                // New separate routes for admin and resident
                adminRoutes: plugin.adminRoutes,
                residentRoutes: plugin.residentRoutes
            };
        });
}

/**
 * Gets routes for a specific user type
 * @param plugin The loaded plugin
 * @param userType The user type ("admin" or "resident")
 * @returns Array of routes for the user type
 */
export function getPluginRoutesForUserType(
    plugin: LoadedPlugin,
    userType: "admin" | "resident"
): PluginRoute[] {
    // If plugin has separate admin/resident routes, use those
    if (userType === "admin" && plugin.adminRoutes && plugin.adminRoutes.length > 0) {
        return plugin.adminRoutes;
    }
    if (userType === "resident" && plugin.residentRoutes && plugin.residentRoutes.length > 0) {
        return plugin.residentRoutes;
    }

    // Otherwise, use legacy routes (applies to both)
    if (plugin.routes && plugin.routes.length > 0) {
        return plugin.routes;
    }

    // Fallback to empty array
    return [];
}

/**
 * Finds a plugin by its path
 * @param path The path to search for
 * @returns The matching plugin or undefined
 */
export function findPluginByPath(path: string): LoadedPlugin | undefined {
    return loadPlugins().find(plugin => isPluginPath(path, plugin.basePath));
}

/**
 * Gets a plugin by its name
 * @param name The plugin name
 * @returns The matching plugin or undefined
 */
export function getPluginByName(name: string): LoadedPlugin | undefined {
    return loadPlugins().find(plugin => plugin.name === name);
}
