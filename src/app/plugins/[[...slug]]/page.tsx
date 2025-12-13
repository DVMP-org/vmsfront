"use client";

import { Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { loadPlugins } from "@/lib/plugin_loader";
import { extractRoutePath, normalizeRoutePath, isPluginPath } from "@/lib/plugin-utils";
import { PluginErrorBoundary } from "@/components/PluginErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileQuestion } from "lucide-react";

interface Props {
    params: { slug: string[] };
}

/**
 * Determines if a route path matches an admin route
 * @param fullPath The full path (e.g., "/plugin_name/admin/validate")
 * @param plugin The plugin to check
 * @returns true if the route matches an admin route
 */
function isAdminRoute(fullPath: string, plugin: ReturnType<typeof loadPlugins>[0]): boolean {
    // Check if path contains "/admin" as a path segment (not just anywhere in the string)
    // This avoids false positives like "/administer" matching
    const pathSegments = fullPath.split("/").filter(Boolean);
    if (pathSegments.includes("admin")) {
        return true;
    }

    // Check if the route matches any admin routes
    if (plugin.adminRoutes && plugin.adminRoutes.length > 0) {
        const routePath = extractRoutePath(fullPath, plugin.basePath);
        const normalizedRoutePath = normalizeRoutePath(routePath);

        return plugin.adminRoutes.some(adminRoute => {
            const adminRoutePath = normalizeRoutePath(adminRoute.path);
            return adminRoutePath === normalizedRoutePath ||
                normalizedRoutePath.startsWith(adminRoutePath + "/");
        });
    }

    return false;
}

function PluginContent({ params }: Props) {
    const slugPath = params.slug?.join("/") ?? "";
    const fullPath = slugPath ? `/${slugPath}` : "/";
    const plugins = loadPlugins();
    const router = useRouter();

    // Determine layout type based on the route path itself
    // Check if any plugin has this as an admin route
    const layoutType = useMemo<"resident" | "admin">(() => {
        for (const plugin of plugins) {
            if (isPluginPath(fullPath, plugin.basePath)) {
                if (isAdminRoute(fullPath, plugin)) {
                    return "admin";
                }
            }
        }
        // Default to resident if not an admin route
        return "resident";
    }, [fullPath, plugins]);

    for (const plugin of plugins) {
        // Check if this path belongs to this plugin
        if (!isPluginPath(fullPath, plugin.basePath)) {
            continue;
        }

        // Determine if this is an admin route for this specific plugin
        const isAdminRouteForPlugin = isAdminRoute(fullPath, plugin);

        // Get routes based on whether this is an admin route or not
        const pluginRoutes = isAdminRouteForPlugin
            ? (plugin.adminRoutes || [])
            : (plugin.residentRoutes || []);

        if (pluginRoutes.length === 0) {
            continue; // No routes available for this route type
        }

        // Extract the route path from the full path
        // e.g., "/electricity/admin/validate" -> "/admin/validate"
        const routePath = extractRoutePath(fullPath, plugin.basePath);
        const normalizedRoutePath = normalizeRoutePath(routePath);
        
        // Sort routes by path length (longer/more specific first) to match most specific route first
        // Root routes ("/" or "") are sorted to the end
        const sortedRoutes = [...pluginRoutes].sort((a, b) => {
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
            <DashboardLayout type={layoutType}>
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
            </DashboardLayout>
        );
    }

    // No plugin or route found - show 404 within layout
    return (
        <DashboardLayout type={layoutType}>
            <Card>
                <CardContent className="p-10">
                    <EmptyState
                        icon={FileQuestion}
                        title="Plugin Not Found"
                        description={`The plugin route "${fullPath}" could not be found. Please check the URL and try again.`}
                        action={{
                            label: "Go to Dashboard",
                            onClick: () => router.push(layoutType === "admin" ? "/admin" : "/select"),
                        }}
                    />
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}

export default function PluginPage({ params }: Props) {
    return <PluginContent params={params} />;
}
