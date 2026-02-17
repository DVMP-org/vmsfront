"use client";

import { usePathname } from "next/navigation";
import { useAdminProfile } from "@/hooks/use-admin";
import { adminLinks } from "@/config/admin-routes";
import { hasPermission } from "@/lib/permissions";
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
    const { data: adminProfile, isLoading } = useAdminProfile();
    const user = useAuthStore((state) => state.user);

    const activeRole = useMemo(() => adminProfile?.role || user?.admin?.role, [adminProfile, user]);

    const requiredPermission = useMemo(() => {
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
        const match = sorted.find(link =>
            link.href !== "#" && (pathname === link.href || pathname?.startsWith(link.href + "/"))
        );

        return match?.permission;
    }, [pathname]);

    const hasAccess = useMemo(() => {
        if (!requiredPermission) return true;
        if (!activeRole) return false;
        return hasPermission(activeRole, requiredPermission);
    }, [activeRole, requiredPermission]);

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

    if (!hasAccess) {
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
