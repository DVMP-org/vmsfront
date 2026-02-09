import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function ResidencyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // <RouteGuard>
            <DashboardLayout type="resident">
                {children}
            </DashboardLayout>
        // </RouteGuard>
    );
}

