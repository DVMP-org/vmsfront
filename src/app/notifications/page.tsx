"use client";

import { useAuthStore } from "@/store/auth-store";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Header } from "@/components/layout/Header";
import { NotificationList } from "./NotificationList";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { useAdminProfile } from "@/hooks/use-admin";

export default function NotificationsPage() {
    const admin = useAdminProfile();
    const isAdmin = admin;

    return (
        <RouteGuard>
            {admin ? (
                <DashboardLayout type={isAdmin ? "admin" : "resident"}>
                    <NotificationList />
                </DashboardLayout>
            ) : (
                <div className="min-h-screen bg-background">
                    <Header type="auth" />
                    <main className="max-w-4xl mx-auto py-12 px-4">
                        <NotificationList />
                    </main>
                </div>
            )}
        </RouteGuard>
    );
}
