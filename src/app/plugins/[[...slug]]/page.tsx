import { notFound } from "next/navigation";
import { loadPlugins } from "@/lib/plugin_loader";

interface Props {
    params: { slug: string[] };
}

// Normalize path by removing leading/trailing slashes and ensuring consistent format
function normalizePath(path: string): string {
    return path.replace(/^\/+|\/+$/g, '');
}

export default function PluginPage({ params }: Props) {
    const slugPath = params.slug?.join("/") ?? "";
    const fullPath = "/" + slugPath;
    const plugins = loadPlugins();

    for (const plugin of plugins) {
        // Normalize basePath for comparison (remove leading slash)
        const normalizedBasePath = normalizePath(plugin.basePath);
        
        // Check if this path belongs to this plugin
        if (!fullPath.startsWith(`/${normalizedBasePath}`) && 
            !(normalizedBasePath === "" && fullPath === "/")) {
            continue;
        }

        // Extract subPath by removing the basePath
        let subPath = fullPath.replace(`/${normalizedBasePath}`, "");
        if (subPath === "") {
            subPath = "/";
        }
        
        // Normalize subPath for comparison
        const normalizedSubPath = normalizePath(subPath);
        
        // Sort routes by path length (longer/more specific first) to match most specific route first
        const sortedRoutes = [...plugin.routes].sort((a, b) => {
            const aPath = normalizePath(a.path);
            const bPath = normalizePath(b.path);
            return bPath.length - aPath.length;
        });

        // Try to find exact match first
        let route = sortedRoutes.find(r => {
            const routePath = normalizePath(r.path);
            return routePath === normalizedSubPath;
        });

        // If no exact match and subPath is empty or root, use the empty path route
        if (!route && (normalizedSubPath === "" || subPath === "/")) {
            route = sortedRoutes.find(r => normalizePath(r.path) === "");
        }

        if (!route) {
            notFound();
        }

        const Component = route.component;
        return <Component />;
    }

    notFound();
}
