"use client";

import { useState } from "react";
import { Crown, Receipt, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

// Re-export the billing components for use in settings
import { SubscriptionSection as SubscriptionContent } from "./billing/components/SubscriptionSection";
import { InvoicesSection } from "./billing/components/InvoicesSection";
import { BillingSettingsSection } from "./billing/components/BillingSettingsSection";

type SubscriptionSubTab = "subscription" | "invoices" | "billing";

interface SubTabConfig {
    id: SubscriptionSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const SUB_TABS: SubTabConfig[] = [
    { id: "subscription", label: "Subscription", icon: Crown },
    { id: "invoices", label: "Invoices", icon: Receipt },
    { id: "billing", label: "Billing", icon: CreditCard },
];

export function SubscriptionSection() {
    const [activeSubTab, setActiveSubTab] = useState<SubscriptionSubTab>("subscription");

    return (
        <div className="flex gap-6">
            {/* Side Tabs */}
            <div className="w-48 flex-shrink-0">
                <nav className="space-y-1">
                    {SUB_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeSubTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSubTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    isActive
                                        ? "bg-[rgb(var(--brand-primary)/0.10)] text-[rgb(var(--brand-primary))] "
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                {activeSubTab === "subscription" && <SubscriptionContent />}
                {activeSubTab === "invoices" && <InvoicesSection />}
                {activeSubTab === "billing" && <BillingSettingsSection />}
            </div>
        </div>
    );
}
