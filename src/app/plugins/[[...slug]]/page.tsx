import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadPlugins } from "@/lib/plugin_loader";
import { extractRoutePath, normalizeRoutePath, isPluginPath } from "@/lib/plugin-utils";
import { PluginErrorBoundary } from "@/components/PluginErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
    params: { slug: string[] };
}

/**
 * Plugin Content Component
 * 
 * Handles routing for plugin pages by:
 * 1. Matching the URL path to a plugin's basePath
 * 2. Extracting the route path from the full URL
 * 3. Finding the matching route component
 * 4. Rendering the component with error boundaries and loading states
 */
function PluginContent({ params }: Props) {
    const slugPath = params.slug?.join("/") ?? "";
    const fullPath = slugPath ? `/${slugPath}` : "/";
    const plugins = loadPlugins();

    for (const plugin of plugins) {
        // Check if this path belongs to this plugin
        if (!isPluginPath(fullPath, plugin.basePath)) {
            continue;
        }

        // Extract the route path from the full path
        // e.g., "/electricity/validate" -> "/validate"
        const routePath = extractRoutePath(fullPath, plugin.basePath);
        const normalizedRoutePath = normalizeRoutePath(routePath);
        
        // Sort routes by path length (longer/more specific first) to match most specific route first
        // Root routes ("/" or "") are sorted to the end
        const sortedRoutes = [...plugin.routes].sort((a, b) => {
            const aPath = normalizeRoutePath(a.path);
            const bPath = normalizeRoutePath(b.path);
            // Empty path (root) should be last
            if (aPath === "") return 1;
            if (bPath === "") return -1;
            return bPath.length - aPath.length;
        });

        // Try to find exact match first
        let route = sortedRoutes.find(r => {
            const routePathNormalized = normalizeRoutePath(r.path);
            return routePathNormalized === normalizedRoutePath;
        });

        // If no exact match and we're at root, try to find root route
        if (!route && (normalizedRoutePath === "" || routePath === "/")) {
            route = sortedRoutes.find(r => normalizeRoutePath(r.path) === "");
        }

        if (!route) {
            continue; // Try next plugin
        }

        const Component = route.component;
        return (
            <PluginErrorBoundary pluginName={plugin.manifest.title}>
                <Suspense
                    fallback={
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    }
                >
                    <Component />
                </Suspense>
            </PluginErrorBoundary>
        );
    }

    notFound();
}

export default function PluginPage({ params }: Props) {
    return <PluginContent params={params} />;
}
