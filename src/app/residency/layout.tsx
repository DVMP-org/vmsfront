import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";

export default function ResidencyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RouteGuard>
            <OrganizationMemberGuard>
                <SubscriptionGuard requireActive={false}>
                    <DashboardLayout type="resident">
                        {children}
                    </DashboardLayout>
                </SubscriptionGuard>
            </OrganizationMemberGuard>
        </RouteGuard>
    );
}

