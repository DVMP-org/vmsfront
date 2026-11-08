"use client";

import { useEffect } from "react";
import { useActiveBrandingTheme } from "@/hooks/use-admin-branding";
import { BrandingTheme } from "@/types";

function hexToRgb(hex?: string | null): string | null {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return null;
    return [1, 3, 5]
        .map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
        .join(" ");
}

function applyTheme(theme: BrandingTheme | null) {
    if (!theme) return;

    const root = document.documentElement;
    const primaryRgb = hexToRgb(theme.primary_color);
    const secondaryRgb = hexToRgb(theme.secondary_color);

    if (primaryRgb) root.style.setProperty("--brand-primary", primaryRgb);
    if (secondaryRgb) root.style.setProperty("--brand-secondary", secondaryRgb);

    // Product action, focus, data and semantic tokens are never tenant-controlled.
    document.getElementById("branding-custom-css")?.remove();
    document.getElementById("branding-custom-js")?.remove();

    // Update favicon
    if (theme.favicon_url) {
        let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (!favicon) {
            favicon = document.createElement("link");
            favicon.rel = "icon";
            document.head.appendChild(favicon);
        }
        favicon.href = theme.favicon_url;
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: activeTheme, error } = useActiveBrandingTheme();

    useEffect(() => {
        if (error || !activeTheme) return;
        applyTheme(activeTheme);
    }, [activeTheme, error]);

    return <>{children}</>;
}

