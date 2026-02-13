"use client";

import { useSearchParams } from "next/navigation";
import { PaymentGatewaysSection } from "./components/PaymentGatewaysSection";
import { BrandingSection } from "./components/BrandingSection";
import { LogsViewer } from "@/components/admin/LogsViewer";
import IntegrationsSection from "./components/IntegrationsSection";

type SettingsTab = "payment" | "branding" | "logs" | "integrations";

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab") as SettingsTab | null;
    const activeTab: SettingsTab = tabParam && ["payment", "branding", "logs", "integrations"].includes(tabParam)
        ? tabParam
        : "payment";

    return (
        <div className="pt-0">
            {activeTab === "payment" && <PaymentGatewaysSection />}
            {activeTab === "branding" && <BrandingSection />}
            {activeTab === "integrations" && <IntegrationsSection />}
            {activeTab === "logs" && <LogsViewer />}
        </div>
    );
}

