/**
 * Utility functions for plugin path handling and normalization
 */

/**
 * Normalizes a path by removing leading/trailing slashes
 * @param path The path to normalize
 * @returns Normalized path without leading/trailing slashes
 */
export function normalizePath(path: string): string {
    if (!path) return "";
    return path.replace(/^\/+|\/+$/g, '');
}

/**
 * Normalizes a route path, treating "/" and "" as root
 * @param path The route path
 * @returns Normalized path (empty string for root)
 */
export function normalizeRoutePath(path: string): string {
    if (!path || path === "/") return "";
    return normalizePath(path);
}

/**
 * Builds a full plugin route path
 * @param basePath The plugin base path (e.g., "/electricity")
 * @param routePath The route path (e.g., "/validate" or "/")
 * @returns Full path (e.g., "/plugins/electricity/validate")
 */
export function buildPluginPath(basePath: string, routePath: string): string {
    const normalizedBase = normalizePath(basePath);
    const normalizedRoute = normalizeRoutePath(routePath);

    if (normalizedRoute === "") {
        return `/plugins/${normalizedBase}`;
    }

    return `/plugins/${normalizedBase}/${normalizedRoute}`;
}

/**
 * Extracts the route path from a full plugin URL
 * @param fullPath The full path (e.g., "/plugins/electricity/validate" or "/electricity/validate")
 * @param basePath The plugin base path (e.g., "/electricity")
 * @returns The route path (e.g., "/validate" or "/")
 */
export function extractRoutePath(fullPath: string, basePath: string): string {
    // Remove /plugins/ prefix if present
    let pathWithoutPrefix = fullPath.replace(/^\/plugins\//, "");
    // Ensure it starts with /
    if (!pathWithoutPrefix.startsWith("/")) {
        pathWithoutPrefix = "/" + pathWithoutPrefix;
    }

    const normalizedBase = normalizePath(basePath);
    const normalizedFull = normalizePath(pathWithoutPrefix);

    if (normalizedFull === normalizedBase) {
        return "/";
    }

    if (normalizedFull.startsWith(normalizedBase + "/")) {
        const routePath = normalizedFull.substring(normalizedBase.length + 1);
        return routePath ? `/${routePath}` : "/";
    }

    return "/";
}

/**
 * Checks if a path matches a plugin base path
 * @param path The path to check (e.g., "/electricity/validate" or "/plugins/electricity/validate")
 * @param basePath The plugin base path (e.g., "/electricity")
 * @returns True if the path belongs to the plugin
 */
export function isPluginPath(path: string, basePath: string): boolean {
    // Remove /plugins/ prefix if present
    let pathWithoutPrefix = path.replace(/^\/plugins\//, "");
    // Ensure it starts with /
    if (!pathWithoutPrefix.startsWith("/")) {
        pathWithoutPrefix = "/" + pathWithoutPrefix;
    }

    const normalizedPath = normalizePath(pathWithoutPrefix);
    const normalizedBase = normalizePath(basePath);

    return normalizedPath === normalizedBase || normalizedPath.startsWith(normalizedBase + "/");
}

