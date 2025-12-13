"use client";

import { useEffect } from "react";
import { useActiveBrandingTheme } from "@/hooks/use-admin-branding";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: activeTheme, error } = useActiveBrandingTheme();

    useEffect(() => {
        // Silently fail if there's an error (e.g., user not authenticated)
        if (error || !activeTheme) return;

        // Apply CSS variables for colors
        const root = document.documentElement;
        root.style.setProperty("--brand-primary", activeTheme.primary_color);
        root.style.setProperty("--brand-secondary", activeTheme.secondary_color);

        // Apply custom CSS
        let customStyleElement = document.getElementById("branding-custom-css");
        if (activeTheme.custom_css) {
            if (!customStyleElement) {
                customStyleElement = document.createElement("style");
                customStyleElement.id = "branding-custom-css";
                document.head.appendChild(customStyleElement);
            }
            customStyleElement.textContent = activeTheme.custom_css;
        } else if (customStyleElement) {
            customStyleElement.remove();
        }

        // Apply custom JavaScript
        let customScriptElement = document.getElementById("branding-custom-js");
        if (activeTheme.custom_js) {
            if (!customScriptElement) {
                customScriptElement = document.createElement("script");
                customScriptElement.id = "branding-custom-js";
                document.head.appendChild(customScriptElement);
            }
            // Remove old script content and add new
            customScriptElement.textContent = activeTheme.custom_js;
        } else if (customScriptElement) {
            customScriptElement.remove();
        }

        // Update favicon
        if (activeTheme.favicon_url) {
            let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
            if (!favicon) {
                favicon = document.createElement("link");
                favicon.rel = "icon";
                document.head.appendChild(favicon);
            }
            favicon.href = activeTheme.favicon_url;
        }

        // Cleanup function
        return () => {
            // Reset to defaults if needed
            root.style.removeProperty("--brand-primary");
            root.style.removeProperty("--brand-secondary");
        };
    }, [activeTheme]);

    return <>{children}</>;
}

