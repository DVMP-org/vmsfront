import { useState, useEffect, ReactElement } from "react";
import { Settings, CreditCard, Palette } from "lucide-react";
import { PaymentGatewaysSection } from "@/components/modules/admin/settings/PaymentGatewaysSection";
import { BrandingSection } from "@/components/modules/admin/settings/BrandingSection";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

type SettingsTab = "payment" | "branding";

export default function SettingsPage() {
    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config: {
            tab: { defaultValue: "payment" },
        },
    });

    const [activeTab, setActiveTab] = useState<SettingsTab>(() => initializeFromUrl("tab") as SettingsTab);

    useEffect(() => {
        syncToUrl({ tab: activeTab });
    }, [activeTab, syncToUrl]);

    return (
        <div className="space-y-4">
            <div className="border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-4 w-4 text-zinc-600" />
                    <h1 className="text-lg font-semibold text-foreground">Platform Settings</h1>
                </div>
                <p className="text-xs text-muted-foreground">Configure payment gateways and branding</p>
            </div>

            <div className="flex gap-1 border-b border-zinc-200">
                <button
                    onClick={() => setActiveTab("payment")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "payment"
                        ? "border-zinc-900 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5" />
                        Payment Gateways
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("branding")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "branding"
                        ? "border-zinc-900 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5" />
                        Branding
                    </div>
                </button>
            </div>

            <div className="pt-4">
                {activeTab === "payment" && <PaymentGatewaysSection />}
                {activeTab === "branding" && <BrandingSection />}
            </div>
        </div>
    );
}

SettingsPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="admin">
                <AdminPermissionGuard>
                    {page}
                </AdminPermissionGuard>
            </DashboardLayout>
        </RouteGuard>
    );
};
