const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "vmsfront.to";

// Reserved subdomains that are not organization slugs
export const RESERVED_SUBDOMAINS = ["www", "app", "api", "admin", "visit"];

export function getSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;

  // Handle localhost development (e.g., org1.localhost)
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".");
    if (parts.length > 1 && parts[0] !== "localhost") {
      return parts[0];
    }
    return null;
  }

  // Handle production (e.g., org1.yourdomain.com)
  const parts = hostname.replace(BASE_DOMAIN, "").split(".").filter(Boolean);

  if (parts.length > 0 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
    return parts[0];
  }

  return null;
}

export function isBaseDomain(): boolean {
  return getSubdomain() === null;
}

export function buildSubdomainUrl(slug: string, path: string = "/"): string {
  if (typeof window === "undefined") return path;

  // Validate slug format
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    console.error(`Invalid slug format: ${slug}`);
    return path;
  }

  // Check if slug is reserved
  if (RESERVED_SUBDOMAINS.includes(slug)) {
    console.error(`Cannot use reserved subdomain: ${slug}`);
    return path;
  }

  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : "";

  if (window.location.hostname.includes("localhost")) {
    return `${protocol}//${slug}.localhost${port}${path}`;
  }

  return `${protocol}//${slug}.${BASE_DOMAIN}${path}`;
}