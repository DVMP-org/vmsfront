import electricity from "@/plugins/electricity";

/**
 * All frontend plugins registered here
 * (can be auto-generated later)
 */
const PLUGINS = [electricity];

export function loadPlugins() {
    return PLUGINS.map(plugin => ({
        name: plugin.manifest.name,
        basePath: plugin.manifest.frontend.basePath,
        manifest: plugin.manifest,
        routes: plugin.routes
    }));
}

/**
 * Finds a plugin by its path
 * @param path The path to search for
 * @returns The matching plugin or undefined
 */
export function findPluginByPath(path: string) {
    const normalizedPath = path.replace(/^\/+/, ""); // Remove leading slashes
    return loadPlugins().find(plugin => {
        const normalizedBasePath = plugin.basePath.replace(/^\/+/, "");
        return normalizedPath.startsWith(normalizedBasePath);
    });
}
