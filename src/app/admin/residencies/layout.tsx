"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
    Building2,
    FolderTree,
    Users,
    Briefcase,
    UserCheck,
    Receipt,
    MessageSquare,
    AlertTriangle,
} from "lucide-react";

type ResidencyTab =
    | "residencies"
    | "groups"
    | "residents"
    | "staff"
    | "visitors"
    | "dues"
    | "forums"
    | "emergencies";

const RESIDENCY_TABS: {
    id: ResidencyTab;
    label: string;
    icon: React.ElementType;
}[] = [
        { id: "residencies", label: "Residencies", icon: Building2 },
        { id: "groups", label: "Groups", icon: FolderTree },
        { id: "residents", label: "Residents", icon: Users },
        { id: "staff", label: "Staff", icon: Briefcase },
        { id: "visitors", label: "Visitors", icon: UserCheck },
        { id: "dues", label: "Dues", icon: Receipt },
        { id: "forums", label: "Forums", icon: MessageSquare },
        { id: "emergencies", label: "Emergencies", icon: AlertTriangle },
    ];

function ResidenciesLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const getActiveTab = (): ResidencyTab => {
        const tab = searchParams?.get("tab") as ResidencyTab | null;
        if (tab && RESIDENCY_TABS.some((t) => t.id === tab)) return tab;
        return "residencies";
    };

    const [activeTab, setActiveTab] = useState<ResidencyTab>(getActiveTab);

    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [searchParams]);

    const handleTabChange = (tab: ResidencyTab) => {
        router.push(`/admin/residencies?tab=${tab}`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <h1 className="text-lg font-semibold text-foreground">
                        Residencies
                    </h1>
                </div>
                <p className="text-xs text-muted-foreground">
                    Manage residencies, groups, residents, staff, visitors, dues, forums and emergencies
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                {RESIDENCY_TABS.map(({ id, label, icon: Icon }) => (
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

export default function ResidenciesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                </div>
            }
        >
            <ResidenciesLayoutContent>{children}</ResidenciesLayoutContent>
        </Suspense>
    );
}
