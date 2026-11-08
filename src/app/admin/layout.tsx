import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";
import { OrganizationSetupGuard } from "@/components/auth/OrganizationSetupGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <DashboardLayout type="admin">
        <OrganizationMemberGuard>
          <OrganizationSetupGuard>
            <AdminPermissionGuard>{children}</AdminPermissionGuard>
          </OrganizationSetupGuard>
        </OrganizationMemberGuard>
      </DashboardLayout>
    </RouteGuard>
  );
}
