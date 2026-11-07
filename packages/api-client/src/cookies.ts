export interface CookieDocument {
  cookie: string;
}

export interface CookieLocation {
  hostname: string;
  protocol: string;
}

export interface CookieUtilityOptions {
  baseDomain?: string;
  document?: CookieDocument;
  location?: CookieLocation;
}

export interface CookieUtilities {
  setCookie: (name: string, value: string, days?: number) => void;
  getCookie: (name: string) => string | null;
  deleteCookie: (name: string) => void;
}

function getBrowserDocument(
  options: CookieUtilityOptions,
): CookieDocument | null {
  if (options.document) return options.document;
  return typeof document === "undefined" ? null : document;
}

function getBrowserLocation(
  options: CookieUtilityOptions,
): CookieLocation | null {
  if (options.location) return options.location;
  return typeof window === "undefined" ? null : window.location;
}

function getCookieDomain(options: CookieUtilityOptions): string {
  const location = getBrowserLocation(options);
  if (!location) return "";

  const hostname = location.hostname;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "";
  }

  const baseDomain = options.baseDomain?.replace(/^\.+/, "");
  if (baseDomain) {
    return `.${baseDomain}`;
  }

  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join(".")}`;
  }

  return "";
}

/**
 * Build cookie helpers with an injected base domain and browser. Production
 * cookies are shared across tenant subdomains; localhost omits the domain
 * attribute and should use a local wildcard domain such as `lvh.me` when
 * cross-subdomain browser acceptance is required.
 */
export function createCookieUtilities(
  options: CookieUtilityOptions = {},
): CookieUtilities {
  const setCookie = (name: string, value: string, days = 7): void => {
    const browserDocument = getBrowserDocument(options);
    const location = getBrowserLocation(options);
    if (!browserDocument || !location) return;

    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    const domain = getCookieDomain(options);
    const domainAttribute = domain ? `; domain=${domain}` : "";
    const secure = location.protocol === "https:" ? "; Secure" : "";

    browserDocument.cookie =
      `${name}=${value || ""}${expires}; path=/${domainAttribute}` +
      `${secure}; SameSite=Lax`;
  };

  const getCookie = (name: string): string | null => {
    const browserDocument = getBrowserDocument(options);
    if (!browserDocument) return null;

    const namePrefix = `${name}=`;
    for (const entry of browserDocument.cookie.split(";")) {
      const cookie = entry.trimStart();
      if (cookie.startsWith(namePrefix)) {
        return cookie.slice(namePrefix.length);
      }
    }
    return null;
  };

  const deleteCookie = (name: string): void => {
    const browserDocument = getBrowserDocument(options);
    if (!browserDocument) return;

    const domain = getCookieDomain(options);
    const domainAttribute = domain ? `; domain=${domain}` : "";
    browserDocument.cookie =
      `${name}=; Path=/${domainAttribute}; SameSite=Lax; ` +
      "Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  };

  return { setCookie, getCookie, deleteCookie };
}
