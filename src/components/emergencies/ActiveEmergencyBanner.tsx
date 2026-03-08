"use client";

import { useActiveEmergencies } from "@/hooks/use-emergency";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { EmergencyTypeLabel } from "./EmergencyBadge";

/**
 * Sticky top banner that appears when there are active emergencies.
 * Polls the API every 30 seconds.
 */
export function ActiveEmergencyBanner() {
    const { data } = useActiveEmergencies();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);

    const activeCount = data?.total ?? 0;

    if (activeCount === 0 || dismissed) return null;

    const latest = data?.items?.[0];

    return (
        <div className="sticky top-0 z-30 bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-3 shadow-md">
            <button
                className="flex items-center gap-2 text-sm font-medium hover:underline"
                onClick={() => router.push("/admin/emergencies?status=active")}
            >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                    {activeCount === 1
                        ? "Active emergency: "
                        : `${activeCount} active emergencies — latest: `}
                    {latest && <EmergencyTypeLabel type={latest.type} />}
                    {latest?.location && ` · ${latest.location}`}
                </span>
                <span className="underline text-xs">View details →</span>
            </button>
            <button
                onClick={() => setDismissed(true)}
                className="shrink-0 p-1 rounded hover:bg-red-700 transition-colors"
                aria-label="Dismiss banner"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
