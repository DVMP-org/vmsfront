"use client";

import { useEffect } from "react";
import { useActiveBrandingTheme } from "@/hooks/use-admin-branding";
import { BrandingTheme } from "@/types";

// Helper function to convert Hex to RGB string (space separated)
function hexToRgb(hex: string): string {
    // Remove the hash if it exists
    hex = hex.replace(/^#/, "");

    // Parse the hex values
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }

    return `${r} ${g} ${b}`;
}

// Helper function to apply theme
function applyTheme(theme: BrandingTheme | null) {
    if (!theme) return;

    const root = document.documentElement;

    // Convert to RGB for tailwind opacity support (bg-[rgb(var(--brand-primary)/0.2)])
    const primaryRgb = hexToRgb(theme.primary_color);
    const secondaryRgb = hexToRgb(theme.secondary_color);

    // Store as "R G B" format
    root.style.setProperty("--brand-primary", primaryRgb);
    root.style.setProperty("--brand-secondary", secondaryRgb);

    // Apply custom CSS
    let customStyleElement = document.getElementById("branding-custom-css");
    if (theme.custom_css) {
        if (!customStyleElement) {
            customStyleElement = document.createElement("style");
            customStyleElement.id = "branding-custom-css";
            document.head.appendChild(customStyleElement);
        }
        customStyleElement.textContent = theme.custom_css;
    } else if (customStyleElement) {
        customStyleElement.remove();
    }

    // Apply custom JavaScript
    let customScriptElement = document.getElementById("branding-custom-js");
    if (theme.custom_js) {
        if (!customScriptElement) {
            customScriptElement = document.createElement("script");
            customScriptElement.id = "branding-custom-js";
            document.head.appendChild(customScriptElement);
        }
        customScriptElement.textContent = theme.custom_js;
    } else if (customScriptElement) {
        customScriptElement.remove();
    }

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

    // Apply theme from API when it loads (updates cached theme)
    // Note: Initial theme is applied via blocking script in layout.tsx
    useEffect(() => {
        // Silently fail if there's an error (e.g., user not authenticated)
        if (error || !activeTheme) return;

        // Apply theme from API (this will update the cached theme)
        applyTheme(activeTheme);
    }, [activeTheme, error]);

    return <>{children}</>;
}

