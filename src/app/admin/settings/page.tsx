"use client";

import { useSearchParams } from "next/navigation";
import { PaymentGatewaysSection } from "./components/PaymentGatewaysSection";
import { BrandingSection } from "./components/BrandingSection";
import IntegrationsSection from "./components/IntegrationsSection";
import { MailerSettingsSection } from "./components/MailerSettingsSection";
import { SubscriptionSection } from "./components/SubscriptionSection";

type SettingsTab = "payment" | "branding" | "integrations" | "mailer" | "subscription";

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab") as SettingsTab | null;
    const activeTab: SettingsTab = tabParam && ["payment", "branding", "integrations", "mailer", "subscription"].includes(tabParam)
        ? tabParam
        : "payment";

    return (
        <div className="pt-0">
            {activeTab === "payment" && <PaymentGatewaysSection />}
            {activeTab === "branding" && <BrandingSection />}
            {activeTab === "integrations" && <IntegrationsSection />}
            {activeTab === "mailer" && <MailerSettingsSection />}
            {activeTab === "subscription" && <SubscriptionSection />}
        </div>
    );
}

