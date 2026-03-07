"use client";

import { useSearchParams } from "next/navigation";
import { SubscriptionSection } from "./components/SubscriptionSection";
import { InvoicesSection } from "./components/InvoicesSection";
import { BillingSettingsSection } from "./components/BillingSettingsSection";

type BillingTab = "subscription" | "invoices" | "settings";

export default function BillingPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab") as BillingTab | null;
    const activeTab: BillingTab =
        tabParam && ["subscription", "invoices", "settings"].includes(tabParam)
            ? tabParam
            : "subscription";

    return (
        <div className="pt-0">
            {activeTab === "subscription" && <SubscriptionSection />}
            {activeTab === "invoices" && <InvoicesSection />}
            {activeTab === "settings" && <BillingSettingsSection />}
        </div>
    );
}
