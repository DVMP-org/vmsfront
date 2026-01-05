import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function HouseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout type="resident">{children}</DashboardLayout>;
}
