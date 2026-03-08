"use client";

import { useEffect } from "react";
import { useActiveBrandingTheme } from "@/hooks/use-admin-branding";
import { applyBrandingTheme } from "../lib/branding-utils";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: activeTheme, error } = useActiveBrandingTheme();

    // Apply theme from API when it loads (updates cached theme)
    // Note: Initial theme is applied via blocking script in layout.tsx
    useEffect(() => {
        // Silently fail if there's an error (e.g., user not authenticated)
        if (error || !activeTheme) return;

        // Apply theme from API (this will update the cached theme)
        applyBrandingTheme(activeTheme);
    }, [activeTheme, error]);

    return <>{children}</>;
}

