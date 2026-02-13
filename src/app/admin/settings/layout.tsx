"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Settings, CreditCard, Palette, Blocks } from "lucide-react";
import { useEffect, useState, Suspense } from "react";

type SettingsTab = "payment" | "branding" | "logs" | "integrations";

function SettingsLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Determine active tab based on pathname or query param
    const getActiveTab = (): SettingsTab => {
        if (pathname?.includes("/admin/settings/integrations")) {
            return "integrations";
        }

        const tabParam = searchParams?.get("tab");
        if (tabParam === "branding" || tabParam === "logs" || tabParam === "integrations") {
            return tabParam as SettingsTab;
        }

        return "payment";
    };

    const [activeTab, setActiveTab] = useState<SettingsTab>("payment");

    // Sync active state when URL changes
    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [pathname, searchParams]);

    const handleTabChange = (tab: SettingsTab) => {
        if (tab === "integrations") {
            if (pathname?.includes("/admin/settings/integrations/")) {
                router.push("/admin/settings?tab=integrations");
            } else {
                router.push(`/admin/settings?tab=${tab}`);
            }
        } else {
            router.push(`/admin/settings?tab=${tab}`);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-4 w-4 text-zinc-600" />
                    <h1 className="text-lg font-semibold text-foreground">Platform Settings</h1>
                </div>
                <p className="text-xs text-muted-foreground">Configure payment gateways and branding</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-zinc-200">
                <button
                    onClick={() => handleTabChange("payment")}
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
                    onClick={() => handleTabChange("branding")}
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
                <button
                    onClick={() => handleTabChange("integrations")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "integrations"
                        ? "border-zinc-900 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Blocks className="h-3.5 w-3.5" />
                        Integrations
                    </div>
                </button>
                <button
                    onClick={() => handleTabChange("logs")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "logs"
                        ? "border-zinc-900 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5" />
                        Logs
                    </div>
                </button>
            </div>

            {/* Content (Rendered by page.tsx or children routes) */}
            <div className="pt-4">
                {children}
            </div>
        </div>
    );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense>
            <SettingsLayoutContent>{children}</SettingsLayoutContent>
        </Suspense>
    )
}
