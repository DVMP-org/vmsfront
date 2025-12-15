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

/**
 * Finds a matching route in the given routes array
 * Optimized with route sorting and caching
 * @param routePath The route path to match (e.g., "/admin/meters")
 * @param routes The routes array to search in
 * @param options Options for matching behavior
 * @returns The matching route or null
 */
export function findMatchingRoute(
    routePath: string,
    routes: Array<{ path: string;[key: string]: any }>,
    options: { checkPrefix?: boolean } = {}
): { path: string;[key: string]: any } | null {
    if (!routes || routes.length === 0) {
        return null;
    }

    const normalizedRoutePath = normalizeRoutePath(routePath);

    // Sort routes by path length (longer/more specific first) for efficient matching
    // Empty path (root) should be last
    const sortedRoutes = [...routes].sort((a, b) => {
        const aPath = normalizeRoutePath(a.path);
        const bPath = normalizeRoutePath(b.path);
        if (aPath === "") return 1;
        if (bPath === "") return -1;
        return bPath.length - aPath.length;
    });

    // Try to find exact match first (most common case)
    for (const route of sortedRoutes) {
        const routePathNormalized = normalizeRoutePath(route.path);
        if (routePathNormalized === normalizedRoutePath) {
            return route;
        }
    }

    // If no exact match and we're at root, try to find root route
    if (normalizedRoutePath === "" || routePath === "/") {
        const rootRoute = sortedRoutes.find(r => normalizeRoutePath(r.path) === "");
        if (rootRoute) return rootRoute;
    }

    // Check for prefix matches if enabled (for nested routes)
    if (options.checkPrefix) {
        for (const route of sortedRoutes) {
            const routePathNormalized = normalizeRoutePath(route.path);
            if (normalizedRoutePath.startsWith(routePathNormalized + "/")) {
                return route;
            }
        }
    }

    return null;
}

/**
 * Finds a matching route and determines layout type from plugin routes
 * This combines route matching with layout type determination for efficiency
 * @param pathname The full pathname
 * @param plugin The plugin to check (must have basePath and at least one routes array)
 * @returns Object with route and layoutType, or null if no match
 */
export function findPluginRouteAndType(
    pathname: string,
    plugin: {
        basePath: string;
        adminRoutes?: Array<{ path: string;[key: string]: any }>;
        residentRoutes?: Array<{ path: string;[key: string]: any }>;
        routes?: Array<{ path: string;[key: string]: any }>;
    }
): { route: { path: string;[key: string]: any }; layoutType: "admin" | "resident" } | null {
    if (!isPluginPath(pathname, plugin.basePath)) {
        return null;
    }

    const routePath = extractRoutePath(pathname, plugin.basePath);

    // Check admin routes first
    if (plugin.adminRoutes && plugin.adminRoutes.length > 0) {
        const route = findMatchingRoute(routePath, plugin.adminRoutes);
        if (route) {
            return { route, layoutType: "admin" };
        }
    }

    // Check resident routes
    if (plugin.residentRoutes && plugin.residentRoutes.length > 0) {
        const route = findMatchingRoute(routePath, plugin.residentRoutes);
        if (route) {
            return { route, layoutType: "resident" };
        }
    }

    // Check legacy routes (default to resident)
    if (plugin.routes && plugin.routes.length > 0) {
        const route = findMatchingRoute(routePath, plugin.routes);
        if (route) {
            return { route, layoutType: "resident" };
        }
    }

    return null;
}

