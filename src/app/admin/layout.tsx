import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RouteGuard>
            <OrganizationMemberGuard>
                <DashboardLayout type="admin">
                    <AdminPermissionGuard>
                        {children}
                    </AdminPermissionGuard>
                </DashboardLayout>
            </OrganizationMemberGuard>
        </RouteGuard>
    );
}

