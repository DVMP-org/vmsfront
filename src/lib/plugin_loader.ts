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

export function findPluginByPath(path: string) {
    return loadPlugins().find(plugin =>
        path.startsWith(plugin.basePath.replace("/", ""))
    );
}
