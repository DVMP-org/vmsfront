"use client";

import { useEffect } from "react";
import { useActiveBrandingTheme } from "@/hooks/use-admin-branding";
import { BrandingTheme } from "@/types";

// Helper function to apply theme
function applyTheme(theme: BrandingTheme | null) {
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty("--brand-primary", theme.primary_color);
    root.style.setProperty("--brand-secondary", theme.secondary_color);

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

