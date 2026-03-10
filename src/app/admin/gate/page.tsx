"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

function TabLoader() {
    return (
        <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
        </div>
    );
}

// Lazy-load each tab section to keep initial bundle small
const GateConsoleSection = dynamic(() => import("./components/GateConsole"), {
    loading: () => <TabLoader />,
});
const GatePassesSection = dynamic(() => import("./passes/page"), {
    loading: () => <TabLoader />,
});
const GateEventsSection = dynamic(() => import("./events/page"), {
    loading: () => <TabLoader />,
});
const GatesSection = dynamic(() => import("../gates/page"), {
    loading: () => <TabLoader />,
});

type GateTab = "console" | "passes" | "events" | "gates";

const VALID_TABS: GateTab[] = ["console", "passes", "events", "gates"];

function GatePageContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab") as GateTab | null;
    const activeTab: GateTab =
        tabParam && VALID_TABS.includes(tabParam) ? tabParam : "console";

    return (
        <>
            {activeTab === "console" && <GateConsoleSection />}
            {activeTab === "passes" && <GatePassesSection />}
            {activeTab === "events" && <GateEventsSection />}
            {activeTab === "gates" && <GatesSection />}
        </>
    );
}

export default function GatePage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                </div>
            }
        >
            <GatePageContent />
        </Suspense>
    );
}
