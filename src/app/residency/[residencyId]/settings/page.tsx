"use client";

import { useResidentResidency } from "@/hooks/use-resident";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { Loader2, Settings, Users, Home as HomeIcon } from "lucide-react";
import { useEffect } from "react";
import { ResidentsSection } from "./components/ResidentsSection";
import { ResidencyDetailsSection } from "./components/ResidencyDetailsSection";

type SettingsTab = "general" | "residents";

export default function ResidentSettingsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = useParams<{ residencyId: string }>();

    const residencyId = params?.residencyId ?? null;
    const activeTab = (searchParams?.get("tab") as SettingsTab) || "general";

    const { data: residentResidency, isLoading, isError } = useResidentResidency(residencyId);

    useEffect(() => {
        if (!isLoading && !isError && residentResidency) {
            if (!residentResidency.is_super_user) {
                router.replace(`/residency/${residencyId}`);
            }
        }
    }, [isLoading, isError, residentResidency, residencyId, router]);

    const handleTabChange = (tab: SettingsTab) => {
        const current = new URLSearchParams(searchParams?.toString());
        current.set("tab", tab);
        const query = current.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (isError || !residentResidency) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <p className="text-destructive">Failed to load residency settings.</p>
            </div>
        );
    }

    if (!residentResidency.is_super_user) {
        return null; // or a "Not Authorized" message if redirect is slow
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-5 w-5 text-zinc-600" />
                    <h1 className="text-xl font-semibold text-foreground">Residency Settings</h1>
                </div>
                <p className="text-sm text-muted-foreground">Manage your residency settings and residents</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-zinc-200">
                <button
                    onClick={() => handleTabChange("general")}
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
                    onClick={() => handleTabChange("residents")}
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
                    <ResidencyDetailsSection residencyId={residencyId!} />
                )}

                {activeTab === "residents" && (
                    <ResidentsSection />
                )}
            </div>
        </div>
    );
}