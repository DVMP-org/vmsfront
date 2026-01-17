import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function HouseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RouteGuard>
            <DashboardLayout type="resident">
                {children}
            </DashboardLayout>
        </RouteGuard>
    );
}

