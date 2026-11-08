import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { OrganizationShell } from "@/components/layout/OrganizationShell";
import { OrganizationSetupGuard } from "@/components/auth/OrganizationSetupGuard";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <OrganizationMemberGuard>
        <OrganizationSetupGuard>
          <OrganizationShell>{children}</OrganizationShell>
        </OrganizationSetupGuard>
      </OrganizationMemberGuard>
    </RouteGuard>
  );
}
