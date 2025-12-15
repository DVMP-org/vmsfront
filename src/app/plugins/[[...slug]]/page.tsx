"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadPlugins } from "@/lib/plugin_loader";
import type { LoadedPlugin } from "@/types/plugin";
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
 * Finds a matching route in the given routes array
 * @param routePath The route path to match (e.g., "/admin/meters")
 * @param routes The routes array to search in
 * @returns The matching route or null
 */
function findMatchingRoute(routePath: string, routes: any[]): any | null {
    if (!routes || routes.length === 0) {
        return null;
    }

    const normalizedRoutePath = normalizeRoutePath(routePath);

    // Sort routes by path length (longer/more specific first)
    const sortedRoutes = [...routes].sort((a, b) => {
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

    return route || null;
}

function PluginContent({ params }: Props) {
    const slugPath = params.slug?.join("/") ?? "";
    const fullPath = slugPath ? `/${slugPath}` : "/";
    const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load plugins from cache first, then refresh from API
    useEffect(() => {
        let isMounted = true;

        // Load cached plugins immediately for instant rendering
        loadPlugins(true)
            .then((loadedPlugins) => {
                if (isMounted) {
                    console.log("PluginPage: Loaded plugins (cached):", loadedPlugins);
                    setPlugins(loadedPlugins);
                    setIsLoading(false);
                }
            })
            .catch((error) => {
                console.error("PluginPage: Failed to load cached plugins:", error);
                // Try to load from API without cache
                return loadPlugins(false);
            })
            .then((loadedPlugins) => {
                if (loadedPlugins && isMounted) {
                    setPlugins(loadedPlugins);
                    setIsLoading(false);
                }
            })
            .catch((error) => {
                console.error("PluginPage: Failed to load plugins:", error);
                if (isMounted) {
                    setPlugins([]);
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Determine layout type based on which routes array the route comes from
    // This is determined when we find the actual matching route below

    // Show loading state while plugins are being loaded
    // Use a default layout type during loading (will be corrected once plugins load)
    const defaultLayoutType: "resident" | "admin" = "resident";

    if (isLoading) {
        return (
            <DashboardLayout type={defaultLayoutType}>
                <div className="p-6 space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </DashboardLayout>
        );
    }

    // Try to find matching route and determine layout type from which routes array it belongs to
    for (const plugin of plugins) {
        // Check if this path belongs to this plugin
        if (!isPluginPath(fullPath, plugin.basePath)) {
            continue;
        }

        // Extract the route path from the full path
        // e.g., "/electricity/admin/validate" -> "/admin/validate"
        const routePath = extractRoutePath(fullPath, plugin.basePath);

        // Try to find the route in each routes array and determine layout type
        // Priority: adminRoutes > residentRoutes > routes (legacy)
        let route: any = null;
        let layoutType: "resident" | "admin" = "resident";

        // Check admin routes first
        if (plugin.adminRoutes && plugin.adminRoutes.length > 0) {
            route = findMatchingRoute(routePath, plugin.adminRoutes);
            if (route) {
                layoutType = "admin";
            }
        }

        // If not found in admin routes, check resident routes
        if (!route && plugin.residentRoutes && plugin.residentRoutes.length > 0) {
            route = findMatchingRoute(routePath, plugin.residentRoutes);
            if (route) {
                layoutType = "resident";
            }
        }

        // If still not found, check legacy routes (default to resident for legacy)
        if (!route && plugin.routes && plugin.routes.length > 0) {
            route = findMatchingRoute(routePath, plugin.routes);
            if (route) {
                // For legacy routes, default to resident layout
                // (could be enhanced to have a userType field in the future)
                layoutType = "resident";
            }
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
    // Try to determine layout type from plugins even if route not found
    let notFoundLayoutType: "resident" | "admin" = "resident";

    // Check if any plugin has admin routes that might match (even if exact route not found)
    for (const plugin of plugins) {
        if (isPluginPath(fullPath, plugin.basePath)) {
            // If plugin has admin routes, default to admin layout
            if (plugin.adminRoutes && plugin.adminRoutes.length > 0) {
                notFoundLayoutType = "admin";
                break;
            }
        }
    }

    return (
        <DashboardLayout type={notFoundLayoutType}>
            <Card>
                <CardContent className="p-10">
                    <EmptyState
                        icon={FileQuestion}
                        title="Plugin Not Found"
                        description={`The plugin route "${fullPath}" could not be found. Please check the URL and try again.`}
                        action={{
                            label: "Go to Dashboard",
                            onClick: () => router.push(notFoundLayoutType === "admin" ? "/admin" : "/select"),
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
