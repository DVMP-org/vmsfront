"use client";

import { usePathname } from "next/navigation";
import { useAdminProfile } from "@/hooks/use-admin";
import { adminLinks } from "@/config/admin-routes";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { hasAdminPermission } from "@/lib/permissions";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";
import Link from "next/link";
import { CardSkeleton } from "../ui/Skeleton";
import { useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";

interface AdminPermissionGuardProps {
    children: React.ReactNode;
}

export function AdminPermissionGuard({ children }: AdminPermissionGuardProps) {
    const pathname = usePathname();
    const workspace=useWorkspaceContext();
    const { data: adminProfile, isLoading } = useAdminProfile();
    const user = useAuthStore((state) => state.user);

    const activeRole = useMemo(() => adminProfile, [adminProfile, user]);

    const matchedRoute = useMemo(() => {
        // Flatten links to find the match for the current pathname
        const flattened: any[] = [];
        adminLinks.forEach((link) => {
            flattened.push(link);
            if (link.children) {
                flattened.push(...link.children);
            }
        });

        // Find the link that matches the current pathname
        // Sort by length descending to match most specific route first
        const sorted = [...flattened].sort((a, b) => (b.href?.length || 0) - (a.href?.length || 0));
        return sorted.find(link =>
            link.href !== "#" && (pathname === link.href || pathname?.startsWith(link.href + "/"))
        );
    }, [pathname]);
    const requiredPermission = matchedRoute?.permission;

    const hasAccess = useMemo(() => {
        if (!requiredPermission) return true;
        if (!activeRole) return false;
        return hasAdminPermission(activeRole, requiredPermission);
    }, [activeRole, requiredPermission]);
    const managementAccess = useMemo(() => {
        if (!matchedRoute?.managementOnly) return true;
        if (workspace.data?.management?.is_administrator) return true;
        return hasAdminPermission(activeRole, [
            "parties.create",
            "place_relationships.create",
        ]);
    }, [activeRole, matchedRoute?.managementOnly, workspace.data?.management?.is_administrator]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
                    <div className="h-4 w-96 animate-pulse rounded-lg bg-muted" />
                </div>
                <CardSkeleton />
            </div>
        );
    }

    const moduleRoute=matchedRoute;
    if(moduleRoute?.module && workspace.isPending) return <p role="status">Loading workspace context…</p>;
    if(moduleRoute?.module && workspace.isError) return <div role="alert">Workspace could not be verified. <button onClick={()=>workspace.refetch()}>Retry</button></div>;
    if (!hasAccess || !managementAccess || (moduleRoute?.module && !workspace.data?.modules.includes(moduleRoute.module))) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <ShieldAlert className="h-10 w-10" />
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Access Denied
                </h1>
                <p className="mb-8 max-w-md text-muted-foreground">
                    You don't have the required permissions to view this page. If you believe this is an error, please contact your system administrator.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/admin">
                            <Home className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <Button onClick={() => window.history.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
