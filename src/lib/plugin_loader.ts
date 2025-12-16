import electricity from "@/plugins/electricity";
import camera from "@/plugins/camera";
import { isPluginPath } from "./plugin-utils";
import type { LoadedPlugin, PluginRoute } from "@/types/plugin";
import { adminService } from "@/services/admin-service";

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
const FRONTEND_PLUGINS = [electricity, camera];

/**
 * Backend plugin from API
 */
interface BackendPlugin {
    id: string;
    name: string;
    version: string;
    enabled: boolean;
    [key: string]: any;
}

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

const PLUGINS_CACHE_KEY = "vmscore_plugins_cache";
const PLUGINS_CACHE_TIMESTAMP_KEY = "vmscore_plugins_cache_timestamp";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Gets cached plugins from localStorage
 * @returns Cached backend plugins or null if cache is invalid/expired
 */
function getCachedPlugins(): BackendPlugin[] | null {
    if (typeof window === "undefined") return null;

    try {
        const cachedData = localStorage.getItem(PLUGINS_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(PLUGINS_CACHE_TIMESTAMP_KEY);

        if (!cachedData || !cachedTimestamp) {
            return null;
        }

        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        // Check if cache is expired
        if (now - timestamp > CACHE_DURATION_MS) {
            localStorage.removeItem(PLUGINS_CACHE_KEY);
            localStorage.removeItem(PLUGINS_CACHE_TIMESTAMP_KEY);
            return null;
        }

        const plugins = JSON.parse(cachedData) as BackendPlugin[];
        return Array.isArray(plugins) ? plugins : null;
    } catch (error) {
        console.error("Failed to read plugins cache:", error);
        // Clear invalid cache
        localStorage.removeItem(PLUGINS_CACHE_KEY);
        localStorage.removeItem(PLUGINS_CACHE_TIMESTAMP_KEY);
        return null;
    }
}

/**
 * Caches plugins in localStorage
 * @param plugins Array of backend plugins to cache
 */
function setCachedPlugins(plugins: BackendPlugin[]): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(PLUGINS_CACHE_KEY, JSON.stringify(plugins));
        localStorage.setItem(PLUGINS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
        console.error("Failed to cache plugins:", error);
        // If storage is full or unavailable, clear old cache and try again
        try {
            localStorage.removeItem(PLUGINS_CACHE_KEY);
            localStorage.removeItem(PLUGINS_CACHE_TIMESTAMP_KEY);
            localStorage.setItem(PLUGINS_CACHE_KEY, JSON.stringify(plugins));
            localStorage.setItem(PLUGINS_CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (retryError) {
            console.error("Failed to cache plugins after retry:", retryError);
        }
    }
}

/**
 * Clears the plugins cache
 */
export function clearPluginsCache(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PLUGINS_CACHE_KEY);
    localStorage.removeItem(PLUGINS_CACHE_TIMESTAMP_KEY);
}

/**
 * Fetches enabled plugins from the backend API
 * @param useCache Whether to use cached data if available
 * @returns Array of enabled backend plugins
 */
async function fetchEnabledPlugins(useCache: boolean = true): Promise<BackendPlugin[]> {
    // Try to use cache first if requested
    if (useCache) {
        const cached = getCachedPlugins();
        if (cached) {
            // Return cached data immediately, but refresh in background
            fetchEnabledPlugins(false).then(plugins => {
                setCachedPlugins(plugins);
            }).catch(() => {
                // Silently fail background refresh
            });
            return cached;
        }
    }

    try {
        const response = await adminService.getPlugins();
        if (response.data && Array.isArray(response.data)) {
            // Only return enabled plugins
            const enabledPlugins = response.data.filter((plugin: BackendPlugin) => plugin.enabled === true);
            // Cache the result
            setCachedPlugins(enabledPlugins);
            return enabledPlugins;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch plugins from API:", error);
        // If API fails, try to return cached data as fallback
        if (useCache) {
            const cached = getCachedPlugins();
            if (cached) {
                console.log("Using cached plugins due to API error");
                return cached;
            }
        }
        // Return empty array on error - plugins won't load
        return [];
    }
}

/**
 * Matches frontend plugin with backend plugin by name
 * @param frontendPlugin Frontend plugin manifest
 * @param backendPlugins Array of backend plugins
 * @returns Matching backend plugin or null
 */
function matchPluginByName(
    frontendPlugin: { manifest: { name: string; version?: string } },
    backendPlugins: BackendPlugin[]
): BackendPlugin | null {
    return backendPlugins.find(
        (backend) => backend.name === frontendPlugin.manifest.name
    ) || null;
}

/**
 * Loads all registered plugins with validation
 * Filters to only include plugins that are enabled in the backend
 * @param useCache Whether to use cached plugins if available (default: true)
 * @returns Array of loaded plugins with normalized data
 */
export async function loadPlugins(useCache: boolean = true): Promise<LoadedPlugin[]> {
    // Fetch enabled plugins from backend (with caching)
    const enabledBackendPlugins = await fetchEnabledPlugins(useCache);

    // Match frontend plugins with backend plugins and filter to only enabled ones
    return FRONTEND_PLUGINS
        .filter(validatePlugin)
        .map(plugin => {
            // Match with backend plugin
            const backendPlugin = matchPluginByName(plugin, enabledBackendPlugins);

            // Only include if plugin is enabled in backend
            if (!backendPlugin) {
                return null;
            }

            // Normalize basePath to always start with /
            const basePath = plugin.manifest.frontend.basePath.startsWith("/")
                ? plugin.manifest.frontend.basePath
                : `/${plugin.manifest.frontend.basePath}`;

            return {
                name: plugin.manifest.name,
                basePath,
                manifest: {
                    ...plugin.manifest,
                    backendVersion: backendPlugin.version,
                },
                routes: plugin.routes,
                adminRoutes: plugin.adminRoutes,
                residentRoutes: plugin.residentRoutes,
                backendId: backendPlugin.id,
            } as LoadedPlugin;
        })
        .filter((plugin): plugin is LoadedPlugin => plugin !== null);
}

/**
 * Synchronous version for components that need immediate access
 * Returns empty array - use async loadPlugins() for actual data
 * @deprecated Use loadPlugins() async version instead
 */
export function loadPluginsSync(): LoadedPlugin[] {
    console.warn("loadPluginsSync() is deprecated. Use async loadPlugins() instead.");
    return [];
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
export async function findPluginByPath(path: string): Promise<LoadedPlugin | undefined> {
    const plugins = await loadPlugins();
    return plugins.find(plugin => isPluginPath(path, plugin.basePath));
}

/**
 * Gets a plugin by its name
 * @param name The plugin name
 * @returns The matching plugin or undefined
 */
export async function getPluginByName(name: string): Promise<LoadedPlugin | undefined> {
    const plugins = await loadPlugins();
    return plugins.find(plugin => plugin.name === name);
}
