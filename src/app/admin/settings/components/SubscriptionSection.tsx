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
        <div className="flex flex-col gap-5 md:flex-row md:gap-6">
            {/* Side Tabs */}
            <div className="w-full shrink-0 md:w-48">
                <nav
                    aria-label="Subscription sections"
                    className="grid grid-cols-3 gap-1 md:block md:space-y-1"
                >
                    {SUB_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeSubTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveSubTab(tab.id)}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--vms-radius-control)] px-2 py-2 text-sm font-semibold transition-colors md:justify-start md:gap-3 md:px-3",
                                    isActive
                                        ? "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)] md:border-l-2 md:border-[var(--vms-active-accent)]"
                                        : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]"
                                )}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
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
