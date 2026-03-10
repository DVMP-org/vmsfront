"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Scan, CreditCard, Activity, DoorOpen } from "lucide-react";

type GateTab = "console" | "passes" | "events" | "gates";

const GATE_TABS: { id: GateTab; label: string; icon: React.ElementType }[] = [
    { id: "console", label: "Gate Console", icon: Scan },
    { id: "passes", label: "Passes", icon: CreditCard },
    { id: "events", label: "Events", icon: Activity },
    { id: "gates", label: "Gates", icon: DoorOpen },
];

function GateLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const getActiveTab = (): GateTab => {
        // Support legacy sub-routes for backward compat
        if (pathname?.endsWith("/passes")) return "passes";
        if (pathname?.endsWith("/events")) return "events";

        const tab = searchParams?.get("tab") as GateTab | null;
        if (tab && GATE_TABS.some((t) => t.id === tab)) return tab;
        return "console";
    };

    const [activeTab, setActiveTab] = useState<GateTab>(getActiveTab);

    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [pathname, searchParams]);

    const handleTabChange = (tab: GateTab) => {
        router.push(`/admin/gate?tab=${tab}`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <Scan className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <h1 className="text-lg font-semibold text-foreground">Gate Management</h1>
                </div>
                <p className="text-xs text-muted-foreground">
                    Monitor gate activity, manage passes, view events, and configure gates
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                {GATE_TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => handleTabChange(id)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === id
                                ? "border-zinc-900 dark:border-zinc-100 text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </div>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="pt-2">{children}</div>
        </div>
    );
}

export default function GateLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                </div>
            }
        >
            <GateLayoutContent>{children}</GateLayoutContent>
        </Suspense>
    );
}
