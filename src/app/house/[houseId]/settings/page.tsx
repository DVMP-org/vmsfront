"use client";

import { useResidentHouse } from "@/hooks/use-resident";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Settings, Users, Home as HomeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ResidentsSection } from "./components/ResidentsSection";

type SettingsTab = "general" | "residents";

export default function ResidentSettingsPage() {
    const router = useRouter();
    const params = useParams<{ houseId: string }>();
    const houseId = params?.houseId ?? null;
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");

    const { data: residentHouse, isLoading, isError } = useResidentHouse(houseId);

    useEffect(() => {
        if (!isLoading && !isError && residentHouse) {
            if (!residentHouse.is_super_user) {
                router.replace(`/house/${houseId}`);
            }
        }
    }, [isLoading, isError, residentHouse, houseId, router]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (isError || !residentHouse) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <p className="text-destructive">Failed to load house settings.</p>
            </div>
        );
    }

    if (!residentHouse.is_super_user) {
        return null; // or a "Not Authorized" message if redirect is slow
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-5 w-5 text-zinc-600" />
                    <h1 className="text-xl font-semibold text-foreground">House Settings</h1>
                </div>
                <p className="text-sm text-muted-foreground">Manage your house settings and residents</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-zinc-200">
                <button
                    onClick={() => setActiveTab("general")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "general"
                        ? "border-zinc-900 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <HomeIcon className="h-4 w-4" />
                        General
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("residents")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "residents"
                        ? "border-zinc-900 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Residents
                    </div>
                </button>
            </div>

            {/* Content */}
            <div className="pt-2">
                {activeTab === "general" && (
                    <div className="bg-card rounded-lg border p-6 shadow-sm max-w-2xl">
                        <h2 className="text-lg font-semibold mb-4">House Details</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                                    <p className="text-base font-medium">{residentHouse.house.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                                    <p className="text-base font-medium">{residentHouse.house.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "residents" && (
                    <ResidentsSection />
                )}
            </div>
        </div>
    );
}