"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Electricity is Site-scoped: every request resolves an active Site activation.
 * Without a selected Site the API correctly refuses, so the page asks for one
 * instead of showing the guard's error.
 */
export function SiteRequired() {
    const router = useRouter();
    return (
        <EmptyState
            icon={Building2}
            title="Select a Site"
            description="Electricity runs on one Site at a time. Choose a Site from the workspace switcher, then open the plugin again."
            action={{
                label: "Go to Site administration",
                onClick: () => router.push("/admin"),
            }}
        />
    );
}
