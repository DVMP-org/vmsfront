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

// Lazy-load each tab section
const ResidenciesSection = dynamic(() => import("./components/ResidenciesList"), {
    loading: () => <TabLoader />,
});
const ResidencyGroupsSection = dynamic(() => import("../residency-groups/page"), {
    loading: () => <TabLoader />,
});
const ResidentsSection = dynamic(() => import("../residents/page"), {
    loading: () => <TabLoader />,
});
const StaffSection = dynamic(() => import("../staff/page"), {
    loading: () => <TabLoader />,
});
const VisitorsSection = dynamic(() => import("../visitors/page"), {
    loading: () => <TabLoader />,
});
const DuesSection = dynamic(() => import("../dues/page"), {
    loading: () => <TabLoader />,
});
const ForumsSection = dynamic(() => import("../forums/page"), {
    loading: () => <TabLoader />,
});
const EmergenciesSection = dynamic(() => import("../emergencies/page"), {
    loading: () => <TabLoader />,
});

type ResidencyTab =
    | "residencies"
    | "groups"
    | "residents"
    | "staff"
    | "visitors"
    | "dues"
    | "forums"
    | "emergencies";

const VALID_TABS: ResidencyTab[] = [
    "residencies",
    "groups",
    "residents",
    "staff",
    "visitors",
    "dues",
    "forums",
    "emergencies",
];

function ResidenciesPageContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab") as ResidencyTab | null;
    const activeTab: ResidencyTab =
        tabParam && VALID_TABS.includes(tabParam) ? tabParam : "residencies";

    return (
        <>
            {activeTab === "residencies" && <ResidenciesSection />}
            {activeTab === "groups" && <ResidencyGroupsSection />}
            {activeTab === "residents" && <ResidentsSection />}
            {activeTab === "staff" && <StaffSection />}
            {activeTab === "visitors" && <VisitorsSection />}
            {activeTab === "dues" && <DuesSection />}
            {activeTab === "forums" && <ForumsSection />}
            {activeTab === "emergencies" && <EmergenciesSection />}
        </>
    );
}

export default function ResidenciesPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                </div>
            }
        >
            <ResidenciesPageContent />
        </Suspense>
    );
}
