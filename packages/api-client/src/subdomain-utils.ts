export const RESERVED_SUBDOMAINS: string[] = [
  "www",
  "app",
  "api",
  "admin",
  "visit",
];

export interface SubdomainLocation {
  hostname: string;
  protocol: string;
  port: string;
}

export interface SubdomainUtilityOptions {
  baseDomain?: string;
  location?: SubdomainLocation | null;
  reservedSubdomains?: readonly string[];
}

export interface SubdomainUtilities {
  getSubdomain: () => string | null;
  isBaseDomain: () => boolean;
  buildSubdomainUrl: (slug: string, path?: string) => string;
}

function getBrowserLocation(
  options: SubdomainUtilityOptions,
): SubdomainLocation | null {
  if (options.location !== undefined) return options.location;
  return typeof window === "undefined" ? null : window.location;
}

export function createSubdomainUtilities(
  options: SubdomainUtilityOptions = {},
): SubdomainUtilities {
  const baseDomain = (options.baseDomain || "vmsfront.to").replace(/^\.+/, "");
  const reservedSubdomains = options.reservedSubdomains ?? RESERVED_SUBDOMAINS;

  const getSubdomain = (): string | null => {
    const location = getBrowserLocation(options);
    if (!location) return null;

    const hostname = location.hostname;
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      const parts = hostname.split(".");
      if (parts.length > 1 && parts[0] !== "localhost") {
        return parts[0];
      }
      return null;
    }

    const baseSuffix = `.${baseDomain}`;
    const relativeHostname =
      hostname === baseDomain
        ? ""
        : hostname.endsWith(baseSuffix)
          ? hostname.slice(0, -baseSuffix.length)
          : hostname;
    const parts = relativeHostname.split(".").filter(Boolean);

    if (parts.length > 0 && !reservedSubdomains.includes(parts[0])) {
      return parts[0];
    }
    return null;
  };

  const isBaseDomain = (): boolean => getSubdomain() === null;

  const buildSubdomainUrl = (slug: string, path = "/"): string => {
    const location = getBrowserLocation(options);
    if (!location) return path;

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      console.error(`Invalid slug format: ${slug}`);
      return path;
    }

    if (reservedSubdomains.includes(slug)) {
      console.error(`Cannot use reserved subdomain: ${slug}`);
      return path;
    }

    const isLocal =
      location.hostname === "localhost" ||
      location.hostname.endsWith(".localhost") ||
      location.hostname === "lvh.me" ||
      location.hostname.endsWith(".lvh.me");

    if (isLocal) {
      const suffix = location.hostname.endsWith("lvh.me")
        ? "lvh.me"
        : "localhost";
      const port = location.port ? `:${location.port}` : "";
      return `${location.protocol}//${slug}.${suffix}${port}${path}`;
    }

    // Public hosts never carry the dev/container port. Proxies forward the
    // internal 3000 port, which otherwise yields `tenant.vmsfront.to:3000`.
    const [baseHost, basePort = ""] = baseDomain.split(":");
    const port = basePort ? `:${basePort}` : "";
    return `${location.protocol}//${slug}.${baseHost}${port}${path}`;
  };

  return { getSubdomain, isBaseDomain, buildSubdomainUrl };
}
