/**
 * Simple client-side cookie utilities
 */

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "";

/**
 * Get the root domain for cross-subdomain cookie sharing
 */
const getCookieDomain = (): string => {
    if (typeof window === 'undefined') return '';
    
    const hostname = window.location.hostname;
    
    // For localhost subdomains (e.g., acme.localhost), set domain to localhost
    // This allows cookies to be shared between localhost and *.localhost
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        return 'localhost';
    }
    
    // For production, use the base domain with leading dot for subdomain sharing
    if (BASE_DOMAIN) {
        return `.${BASE_DOMAIN}`;
    }
    
    // Fallback: extract root domain from hostname (e.g., acme.vmscore.to -> .vmscore.to)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
        // Get last two parts (e.g., vmscore.to from acme.vmscore.to)
        const rootDomain = parts.slice(-2).join('.');
        return `.${rootDomain}`;
    }
    
    return '';
};

export const setCookie = (name: string, value: string, days = 7) => {
    if (typeof document === 'undefined') return;

    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    
    const domain = getCookieDomain();
    const domainAttr = domain ? `; domain=${domain}` : '';

    // Secure and SameSite for production
    // Use SameSite=Lax to allow cross-subdomain navigation while maintaining CSRF protection
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${value || ""}${expires}; path=/${domainAttr}${secure}; SameSite=Lax`;
};

export const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

export const deleteCookie = (name: string) => {
    if (typeof document === 'undefined') return;
    
    const domain = getCookieDomain();
    const domainAttr = domain ? `; domain=${domain}` : '';
    
    document.cookie = `${name}=; Path=/${domainAttr}; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};
