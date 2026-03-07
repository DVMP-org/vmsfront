import { RouteGuard } from "@/components/auth/RouteGuard";
import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";

export default function SelectLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RouteGuard>
            <OrganizationMemberGuard>
                <SubscriptionGuard requireActive={false}>
                {children}
                </SubscriptionGuard>
            </OrganizationMemberGuard>
        </RouteGuard>
    );
}
