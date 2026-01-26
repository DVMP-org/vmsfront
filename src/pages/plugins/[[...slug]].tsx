import { Suspense, useMemo, useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/router";
import { loadPlugins } from "@/lib/plugin_loader";
import type { LoadedPlugin } from "@/types/plugin";
import { findPluginRouteAndType } from "@/lib/plugin-utils";
import { PluginErrorBoundary } from "@/components/PluginErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileQuestion } from "lucide-react";

export default function PluginPage() {
    const router = useRouter();
    const { slug } = router.query;
    const slugPath = useMemo(() => (Array.isArray(slug) ? slug.join("/") : slug) || "", [slug]);
    const fullPath = slugPath ? `/${slugPath}` : "/";

    const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!router.isReady) return;
        let isMounted = true;

        loadPlugins(true)
            .then(res => { if (isMounted) { setPlugins(res); setIsLoading(false); } })
            .catch(() => loadPlugins(false))
            .then(res => { if (res && isMounted) { setPlugins(res); setIsLoading(false); } })
            .catch(() => { if (isMounted) { setPlugins([]); setIsLoading(false); } });

        return () => { isMounted = false; };
    }, [router.isReady]);

    const matchedRoute = useMemo(() => {
        if (isLoading || plugins.length === 0) return null;
        for (const plugin of plugins) {
            const result = findPluginRouteAndType(fullPath, plugin);
            if (result) return { ...result, plugin };
        }
        return null;
    }, [fullPath, plugins, isLoading]);

    const notFoundLayoutType = useMemo<"resident" | "admin">(() => {
        if (isLoading || plugins.length === 0) return "resident";
        for (const plugin of plugins) {
            if (plugin.basePath && fullPath.includes(plugin.basePath)) {
                if (plugin.adminRoutes?.length) return "admin";
            }
        }
        return "resident";
    }, [fullPath, plugins, isLoading]);

    if (!router.isReady || isLoading) {
        return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-32 w-full" /></div>;
    }

    if (matchedRoute) {
        const { route, layoutType, plugin } = matchedRoute;
        const Component = route.component;
        return (
            <DashboardLayout type={layoutType}>
                <PluginErrorBoundary pluginName={plugin.manifest.title}>
                    <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-32 w-full" /></div>}>
                        <Component />
                    </Suspense>
                </PluginErrorBoundary>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type={notFoundLayoutType}>
            <Card><CardContent className="p-10"><EmptyState icon={FileQuestion} title="Plugin Not Found" description={`The plugin route "${fullPath}" could not be found.`} action={{ label: "Go to Dashboard", onClick: () => router.push(notFoundLayoutType === "admin" ? "/admin" : "/select") }} /></CardContent></Card>
        </DashboardLayout>
    );
}
