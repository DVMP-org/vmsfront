"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadPlugins } from "@/lib/plugin_loader";
import type { LoadedPlugin } from "@/types/plugin";
import { findPluginRouteAndType } from "@/lib/plugin-utils";
import { PluginErrorBoundary } from "@/components/PluginErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { FileQuestion, PlugZap } from "lucide-react";

function PluginContent() {
  const params = useParams<{ slug?: string[] }>();
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

  // Find matching route and determine layout type using optimized utility
  // This combines route matching with layout type determination for efficiency
  const matchedRoute = useMemo(() => {
    if (isLoading || plugins.length === 0) {
      return null;
    }
    for (const plugin of plugins) {
      const result = findPluginRouteAndType(fullPath, plugin);
      if (result) {
        return { ...result, plugin };
      }
    }
    return null;
  }, [fullPath, plugins, isLoading]);

  // Determine layout type for 404 case (when no route found)
  const notFoundLayoutType = useMemo<"resident" | "admin">(() => {
    if (isLoading || plugins.length === 0) {
      return "resident";
    }
    for (const plugin of plugins) {
      // Check if path belongs to a plugin with admin routes
      if (plugin.basePath && fullPath.includes(plugin.basePath)) {
        if (plugin.adminRoutes && plugin.adminRoutes.length > 0) {
          return "admin";
        }
      }
    }
    return "resident";
  }, [fullPath, plugins, isLoading]);

  // Installation for the organization is eligibility only. The Site must have
  // activated the plugin, otherwise its routes do not exist for this workspace.
  const workspaceContext = useWorkspaceContext();
  const activePlugins = workspaceContext.data?.active_plugins ?? [];

  // Show loading state while plugins are being loaded
  if (isLoading || workspaceContext.isPending) {
    return (
      <DashboardLayout type="resident">
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Render matched route if found
  if (matchedRoute) {
    const { route, layoutType, plugin } = matchedRoute;
    const Component = route.component;
    if (!activePlugins.includes(plugin.name)) {
      return (
        <DashboardLayout type={layoutType}>
          <Card>
            <CardContent className="p-10">
              <EmptyState
                icon={PlugZap}
                title={`${plugin.manifest.title} is not active here`}
                description="Plugins run only on Sites that activated them. Ask the Site administrator to activate this plugin for this Site."
                action={{
                  label: "Go to Dashboard",
                  onClick: () =>
                    router.push(layoutType === "admin" ? "/admin" : "/"),
                }}
              />
            </CardContent>
          </Card>
        </DashboardLayout>
      );
    }
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
              onClick: () =>
                router.push(notFoundLayoutType === "admin" ? "/admin" : "/"),
            }}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export default function PluginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      <PluginContent />
    </Suspense>
  );
}
