import type { BrandingTheme } from "@/types";
import {
  readLocalStorage,
  removeLocalStorage,
  writeLocalStorage,
} from "@/lib/client-cache";
import { BASE_DOMAIN, RESERVED_SUBDOMAINS, getSubdomain } from "./subdomain-utils";

const BRANDING_CACHE_PREFIX = "branding-theme-cache";
const GLOBAL_BRANDING_CACHE_KEY = `${BRANDING_CACHE_PREFIX}:global`;
const CUSTOM_CSS_ELEMENT_ID = "branding-custom-css";
const CUSTOM_SCRIPT_ELEMENT_ID = "branding-custom-js";

type BrandingCacheEntry = {
  version: 1;
  scope: "global" | "org";
  orgSlug: string | null;
  cachedAt: number;
  theme: BrandingTheme;
};

function normalizeOrgSlug(orgSlug?: string | null): string | null {
  if (!orgSlug) return null;
  const normalized = orgSlug.trim().toLowerCase();
  return normalized || null;
}

function getScopedBrandingCacheKey(orgSlug?: string | null): string {
  const normalizedOrgSlug = normalizeOrgSlug(orgSlug);
  return normalizedOrgSlug
    ? `${BRANDING_CACHE_PREFIX}:org:${normalizedOrgSlug}`
    : GLOBAL_BRANDING_CACHE_KEY;
}

function getCurrentOrgSlug(): string | null {
  return normalizeOrgSlug(getSubdomain());
}

function parseCachedTheme(raw: string | null): BrandingTheme | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as BrandingTheme | BrandingCacheEntry;

    if (parsed && typeof parsed === "object" && "theme" in parsed) {
      return parsed.theme;
    }

    return parsed as BrandingTheme;
  } catch (error) {
    console.error("Failed to parse cached theme:", error);
    return null;
  }
}

/**
 * Converts a hex colour to a space-separated RGB channel string
 * (e.g. "#ff8800" → "255 136 0").
 *
 * The output is intentionally NOT wrapped in `rgb()` so it can be used as a
 * CSS custom-property value and support Tailwind opacity modifiers:
 *
 *   --brand-primary: 255 136 0;
 *   bg-[rgb(var(--brand-primary))]/20   ← works; bg-[rgb(rgb(...))]/20 would not
 */
export function hexToRgb(hex: string): string {
  if (!hex) return "0 0 0";

  const sanitized = hex.replace(/^#/, "").toLowerCase();

  let r = 0;
  let g = 0;
  let b = 0;

  if (sanitized.length === 3) {
    r = parseInt(sanitized[0] + sanitized[0], 16);
    g = parseInt(sanitized[1] + sanitized[1], 16);
    b = parseInt(sanitized[2] + sanitized[2], 16);
  } else if (sanitized.length === 6 || sanitized.length === 8) {
    // 8-digit hex includes alpha — we ignore the alpha channel
    r = parseInt(sanitized.substring(0, 2), 16);
    g = parseInt(sanitized.substring(2, 4), 16);
    b = parseInt(sanitized.substring(4, 6), 16);
  } else {
    // Invalid hex length
    return "0 0 0";
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return "0 0 0";

  return `${r} ${g} ${b}`;
}

export function getCachedBrandingTheme(options?: {
  orgSlug?: string | null;
  fallbackToGlobal?: boolean;
}): BrandingTheme | null {
  if (typeof window === "undefined") return null;

  const orgSlug = normalizeOrgSlug(options?.orgSlug) ?? getCurrentOrgSlug();
  const cacheKeys = orgSlug
    ? [getScopedBrandingCacheKey(orgSlug), ...(options?.fallbackToGlobal ? [GLOBAL_BRANDING_CACHE_KEY] : [])]
    : [GLOBAL_BRANDING_CACHE_KEY];

  for (const cacheKey of cacheKeys) {
    const theme = parseCachedTheme(readLocalStorage(cacheKey));
    if (theme) {
      return theme;
    }
  }

  return null;
}

export function setCachedBrandingTheme(
  theme: BrandingTheme | null,
  options?: {
    hasOrganizationHeader?: boolean;
    orgSlug?: string | null;
  }
): void {
  if (typeof window === "undefined") return;

  const orgSlug = normalizeOrgSlug(options?.orgSlug) ?? getCurrentOrgSlug();
  const hasOrganizationHeader = options?.hasOrganizationHeader ?? !!orgSlug;
  const cacheKey = getScopedBrandingCacheKey(hasOrganizationHeader ? orgSlug : null);

  try {
    if (!theme) {
      removeLocalStorage(cacheKey);
      return;
    }

    const entry: BrandingCacheEntry = {
      version: 1,
      scope: hasOrganizationHeader ? "org" : "global",
      orgSlug: hasOrganizationHeader ? orgSlug : null,
      cachedAt: Date.now(),
      theme,
    };

    writeLocalStorage(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.error("Failed to cache theme:", error);
  }
}

export function clearCachedBrandingTheme(options?: {
  hasOrganizationHeader?: boolean;
  orgSlug?: string | null;
}): void {
  setCachedBrandingTheme(null, options);
}

export function applyBrandingTheme(theme: BrandingTheme | null): void {
  if (!theme || typeof document === "undefined") return;

  const root = document.documentElement;

  root.style.setProperty("--brand-primary", hexToRgb(theme.primary_color));
  root.style.setProperty("--brand-secondary", hexToRgb(theme.secondary_color));

  let customStyleElement = document.getElementById(CUSTOM_CSS_ELEMENT_ID);
  if (theme.custom_css) {
    if (!customStyleElement) {
      customStyleElement = document.createElement("style");
      customStyleElement.id = CUSTOM_CSS_ELEMENT_ID;
      document.head.appendChild(customStyleElement);
    }
    customStyleElement.textContent = theme.custom_css;
  } else if (customStyleElement) {
    customStyleElement.remove();
  }

  let customScriptElement = document.getElementById(CUSTOM_SCRIPT_ELEMENT_ID);
  if (theme.custom_js) {
    if (!customScriptElement) {
      customScriptElement = document.createElement("script");
      customScriptElement.id = CUSTOM_SCRIPT_ELEMENT_ID;
      document.head.appendChild(customScriptElement);
    }
    customScriptElement.textContent = theme.custom_js;
  } else if (customScriptElement) {
    customScriptElement.remove();
  }

  if (theme.favicon_url) {
    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = theme.favicon_url;
  }
}

export function getBrandingBootstrapScript(): string {
  return `
    (function() {
      try {
        var root = document.documentElement;
        var darkMode = localStorage.getItem('darkMode');

        if (darkMode === 'true' || (!darkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }

        var BASE_DOMAIN = ${JSON.stringify(BASE_DOMAIN)};
        var RESERVED_SUBDOMAINS = ${JSON.stringify(RESERVED_SUBDOMAINS)};
        var CACHE_PREFIX = ${JSON.stringify(BRANDING_CACHE_PREFIX)};
        var GLOBAL_CACHE_KEY = ${JSON.stringify(GLOBAL_BRANDING_CACHE_KEY)};
        var CUSTOM_CSS_ID = ${JSON.stringify(CUSTOM_CSS_ELEMENT_ID)};
        var hostname = window.location.hostname;

        function hexToRgb(hex) {
          if (!hex) return '0 0 0';
          var sanitized = String(hex).replace(/^#/, '');
          var r = 0, g = 0, b = 0;

          if (sanitized.length === 3) {
            r = parseInt(sanitized.charAt(0) + sanitized.charAt(0), 16);
            g = parseInt(sanitized.charAt(1) + sanitized.charAt(1), 16);
            b = parseInt(sanitized.charAt(2) + sanitized.charAt(2), 16);
          } else if (sanitized.length === 6) {
            r = parseInt(sanitized.slice(0, 2), 16);
            g = parseInt(sanitized.slice(2, 4), 16);
            b = parseInt(sanitized.slice(4, 6), 16);
          }

          return r + ' ' + g + ' ' + b;
        }

        function getOrgSlug() {
          if (hostname.indexOf('localhost') !== -1) {
            var localhostParts = hostname.split('.');
            if (localhostParts.length > 1 && localhostParts[0] !== 'localhost' && RESERVED_SUBDOMAINS.indexOf(localhostParts[0]) === -1) {
              return localhostParts[0].toLowerCase();
            }
            return null;
          }

          var suffix = '.' + BASE_DOMAIN;
          if (!hostname.endsWith(suffix)) {
            return null;
          }

          var candidate = hostname.slice(0, -suffix.length).trim().toLowerCase();
          if (!candidate || RESERVED_SUBDOMAINS.indexOf(candidate) !== -1) {
            return null;
          }

          return candidate;
        }

        function parseTheme(raw) {
          if (!raw) return null;
          try {
            var parsed = JSON.parse(raw);
            return parsed && parsed.theme ? parsed.theme : parsed;
          } catch (e) {
            return null;
          }
        }

        function applyTheme(theme) {
          if (!theme) return;

          if (theme.primary_color) {
            root.style.setProperty('--brand-primary', hexToRgb(theme.primary_color));
          }
          if (theme.secondary_color) {
            root.style.setProperty('--brand-secondary', hexToRgb(theme.secondary_color));
          }

          if (theme.custom_css) {
            var customStyleElement = document.getElementById(CUSTOM_CSS_ID);
            if (!customStyleElement) {
              customStyleElement = document.createElement('style');
              customStyleElement.id = CUSTOM_CSS_ID;
              document.head.appendChild(customStyleElement);
            }
            customStyleElement.textContent = theme.custom_css;
          }

          if (theme.favicon_url) {
            var favicon = document.querySelector("link[rel='icon']");
            if (!favicon) {
              favicon = document.createElement('link');
              favicon.rel = 'icon';
              document.head.appendChild(favicon);
            }
            favicon.href = theme.favicon_url;
          }
        }

        var orgSlug = getOrgSlug();
        var cacheKeys = orgSlug
          ? [CACHE_PREFIX + ':org:' + orgSlug, GLOBAL_CACHE_KEY]
          : [GLOBAL_CACHE_KEY];

        for (var i = 0; i < cacheKeys.length; i += 1) {
          var theme = parseTheme(localStorage.getItem(cacheKeys[i]));
          if (theme) {
            applyTheme(theme);
            break;
          }
        }
      } catch (e) {
        // Ignore bootstrap branding errors
      }
    })();
  `;
}