"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Wallet, Crown, Receipt, Settings } from "lucide-react";
import { useEffect, useState, Suspense } from "react";

type BillingTab = "subscription" | "invoices" | "settings";

function BillingLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Determine active tab based on pathname or query param
    const getActiveTab = (): BillingTab => {
        const tabParam = searchParams?.get("tab");
        if (tabParam === "invoices" || tabParam === "settings") {
            return tabParam as BillingTab;
        }
        return "subscription";
    };

    const [activeTab, setActiveTab] = useState<BillingTab>("subscription");

    // Sync active state when URL changes
    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [pathname, searchParams]);

    const handleTabChange = (tab: BillingTab) => {
        router.push(`/admin/billing?tab=${tab}`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-zinc-600" />
                    <h1 className="text-lg font-semibold text-foreground">Billing & Subscription</h1>
                </div>
                <p className="text-xs text-muted-foreground">
                    Manage your subscription plan, view invoices, and update billing settings
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-zinc-200">
                <button
                    onClick={() => handleTabChange("subscription")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "subscription"
                            ? "border-zinc-900 text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Crown className="h-3.5 w-3.5" />
                        Subscription
                    </div>
                </button>
                <button
                    onClick={() => handleTabChange("invoices")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "invoices"
                            ? "border-zinc-900 text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Receipt className="h-3.5 w-3.5" />
                        Invoices
                    </div>
                </button>
                <button
                    onClick={() => handleTabChange("settings")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "settings"
                            ? "border-zinc-900 text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Settings className="h-3.5 w-3.5" />
                        Billing Settings
                    </div>
                </button>
            </div>

            {/* Content (Rendered by page.tsx or children routes) */}
            <div className="pt-4">{children}</div>
        </div>
    );
}

export default function BillingLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                </div>
            }
        >
            <BillingLayoutContent>{children}</BillingLayoutContent>
        </Suspense>
    );
}
