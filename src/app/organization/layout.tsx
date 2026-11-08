import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { OrganizationShell } from "@/components/layout/OrganizationShell";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <OrganizationMemberGuard>
        <OrganizationShell>{children}</OrganizationShell>
      </OrganizationMemberGuard>
    </RouteGuard>
  );
}
