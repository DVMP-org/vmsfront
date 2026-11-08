"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdminProfile } from "@/hooks/use-admin";
import { adminLinks } from "@/config/admin-routes";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { hasAdminPermission } from "@/lib/permissions";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";
import Link from "next/link";
import { CardSkeleton } from "../ui/Skeleton";
import { useEffect, useMemo, useState } from "react";

interface AdminPermissionGuardProps {
    children: React.ReactNode;
}

export function AdminPermissionGuard({ children }: AdminPermissionGuardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const workspace=useWorkspaceContext();
    const { data: adminProfile, isLoading } = useAdminProfile();
    const [redirecting, setRedirecting] = useState(false);

    const activeRole = useMemo(() => adminProfile, [adminProfile]);

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
    const requiresManagementContext =
        !!pathname?.startsWith("/admin") && pathname !== "/admin/profile";
    const managementAccess =
        workspace.data?.management?.is_administrator === true;

    useEffect(() => {
        if (
            isLoading ||
            !requiresManagementContext ||
            workspace.isPending ||
            workspace.isError ||
            managementAccess
        ) {
            return;
        }
        setRedirecting(true);
        router.replace("/organization/workspaces?reason=management-required");
    }, [
        isLoading,
        managementAccess,
        requiresManagementContext,
        router,
        workspace.isError,
        workspace.isPending,
    ]);

    if (isLoading || (requiresManagementContext && workspace.isPending)) {
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
    if (requiresManagementContext && workspace.isError) {
        return (
            <div
                role="alert"
                className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"
            >
                <p className="font-semibold">Workspace access could not be verified.</p>
                <p className="mt-1">
                    Retry before opening property operations.
                </p>
                <button
                    type="button"
                    className="mt-3 font-semibold underline"
                    onClick={() => workspace.refetch()}
                >
                    Retry
                </button>
            </div>
        );
    }
    if (
        requiresManagementContext &&
        (!managementAccess || redirecting)
    ) {
        return (
            <p role="status" className="sr-only">
                Opening Workspaces. Management requires authority for the
                selected property.
            </p>
        );
    }
    if (!hasAccess || (moduleRoute?.module && !workspace.data?.modules?.includes(moduleRoute.module))) {
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
                        <Link href="/organization/workspaces">
                            <Home className="mr-2 h-4 w-4" />
                            Back to Workspaces
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
