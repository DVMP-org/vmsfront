import { useResidentHouse } from "@/hooks/use-resident";
import { useRouter } from "next/router";
import { Loader2, Settings, Users, Home as HomeIcon } from "lucide-react";
import { useEffect, useState, useMemo, ReactElement } from "react";
import { ResidentsSection } from "@/components/modules/house/settings/ResidentsSection";
import { HouseDetailsSection } from "@/components/modules/house/settings/HouseDetailsSection";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";

type SettingsTab = "general" | "residents";

export default function ResidentSettingsPage() {
    const router = useRouter();
    const { houseId, tab } = router.query;
    const hId = useMemo(() => (Array.isArray(houseId) ? houseId[0] : houseId) || "", [houseId]);
    const activeTab = (tab as SettingsTab) || "general";

    const { data: residentHouse, isLoading, isError } = useResidentHouse(hId);

    useEffect(() => {
        if (router.isReady && !isLoading && !isError && residentHouse) {
            if (!residentHouse.is_super_user) {
                router.replace(`/house/${hId}`);
            }
        }
    }, [router.isReady, isLoading, isError, residentHouse, hId, router]);

    const handleTabChange = (nextTab: SettingsTab) => {
        router.push({ query: { ...router.query, tab: nextTab } }, undefined, { shallow: true });
    };

    if (!router.isReady) return null;
    if (isLoading) return <div className="flex h-96 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    if (isError || !residentHouse) return <div className="p-24 text-center text-destructive">Failed to load settings.</div>;
    if (!residentHouse.is_super_user) return null;

    return (
        <div className="space-y-6">
            <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-2xl font-bold tracking-tight">House Settings</h1>
                </div>
                <p className="text-sm text-muted-foreground">Manage your house settings and residents</p>
            </div>

            <div className="flex gap-4 border-b">
                <button onClick={() => handleTabChange("general")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === "general" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    <div className="flex items-center gap-2"><HomeIcon className="h-4 w-4" />General</div>
                </button>
                <button onClick={() => handleTabChange("residents")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === "residents" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4" />Residents</div>
                </button>
            </div>

            <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "general" ? <HouseDetailsSection houseId={hId} /> : <ResidentsSection />}
            </div>
        </div>
    );
}

ResidentSettingsPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="resident">
                {page}
            </DashboardLayout>
        </RouteGuard>
    );
};
