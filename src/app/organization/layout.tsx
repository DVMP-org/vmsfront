import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { OrganizationShell } from "@/components/layout/OrganizationShell";
import { OrganizationAccessGuard } from "@/features/organization-workspace/components/OrganizationAccessGuard";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <OrganizationShell>
        <OrganizationMemberGuard>
          <OrganizationAccessGuard>{children}</OrganizationAccessGuard>
        </OrganizationMemberGuard>
      </OrganizationShell>
    </RouteGuard>
  );
}
