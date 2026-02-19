import { RouteGuard } from "@/components/auth/RouteGuard";
import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";

export default function SelectLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RouteGuard>
            <OrganizationMemberGuard>
                {children}
            </OrganizationMemberGuard>
        </RouteGuard>
    );
}
