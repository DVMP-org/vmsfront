"use client";

import { useParams, notFound } from "next/navigation";
import { loadPlugins } from "@/lib/plugin_loader";

export default function PluginRouter() {
    const params = useParams();
    const slug = params.slug || [];

    const plugins = loadPlugins();

    for (const plugin of plugins) {
        const base = plugin.basePath.replace("/", "");
        if (slug[0] !== base) continue;

        const subPath = slug.slice(1).join("/");
        const route =
            plugin.manifest.frontend.routes.find(r => r.path === subPath) ||
            plugin.manifest.frontend.routes.find(r => r.path === "");

        if (!route) return notFound();

        const Component = plugin.routes[route.component];
        if (!Component) return notFound();

        return <Component />;
    }

    return notFound();
}
