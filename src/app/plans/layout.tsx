import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <OrganizationMemberGuard>{children}</OrganizationMemberGuard>
    </RouteGuard>
  );
}
