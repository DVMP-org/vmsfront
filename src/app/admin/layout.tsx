"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardLayout type="admin">
            <AdminPermissionGuard>
                {children}
            </AdminPermissionGuard>
        </DashboardLayout>
    );
}
