import type { Admin, Organization } from "@/types";
import type { Integration } from "@/types/integration";
import type { UseCase } from "@/features/context/api";

import type { OrganizationSiteSummary, OrganizationImportModel } from "./api";

export const ORGANIZATION_WORKSPACE_PATH = "/organization";
export const ORGANIZATION_SITES_PATH = "/organization/sites";

export const operatingTypeLabels: Record<UseCase, string> = {
    residential: "Residential",
    commercial: "Commercial",
    mixed_use: "Mixed-use",
    hospitality: "Hospitality",
};

export function operatingTypeLabel(value: UseCase | string | null | undefined) {
    if (!value) return "Unspecified";
    return operatingTypeLabels[value as UseCase] ?? String(value);
}

export type SiteStatusTone = "success" | "neutral";

export function siteStatus(site: Pick<OrganizationSiteSummary, "is_active">) {
    return site.is_active
        ? { label: "Active", tone: "success" as SiteStatusTone }
        : { label: "Archived", tone: "neutral" as SiteStatusTone };
}

export interface PortfolioMetrics {
    totalSites: number;
    totalPlaces: number;
    totalMembers: number;
    activeIntegrations: number;
}

export function buildPortfolioMetrics({
    sites,
    organization,
    integrations,
}: {
    sites: OrganizationSiteSummary[];
    organization?: Organization | null;
    integrations: Integration[];
}): PortfolioMetrics {
    return {
        totalSites: sites.length,
        totalPlaces: sites.reduce((total, site) => total + site.place_count, 0),
        totalMembers:
            organization?.members_count ?? organization?.admins?.length ?? 0,
        activeIntegrations: integrations.filter((integration) => integration.enabled)
            .length,
    };
}

export type ActivityKind = "site" | "member" | "integration";

export interface ActivityEvent {
    id: string;
    kind: ActivityKind;
    title: string;
    description: string;
    occurredAt: string;
    href?: string;
}

const ACTIVITY_LIMIT = 8;

export function buildActivityFeed({
    sites,
    admins,
    integrations,
    organizationSlug,
}: {
    sites: OrganizationSiteSummary[];
    admins: Admin[];
    integrations: Integration[];
    organizationSlug?: string | null;
}): ActivityEvent[] {
    const events: ActivityEvent[] = [];

    for (const site of sites) {
        events.push({
            id: `site-created-${site.id}`,
            kind: "site",
            title: `${site.name} created`,
            description: `${operatingTypeLabel(site.use_case)} Site${site.parent_site_name ? ` under ${site.parent_site_name}` : ""
                }`,
            occurredAt: site.created_at,
            href: organizationSlug
                ? `/organization/sites/${site.id}`
                : undefined,
        });
        if (site.updated_at && site.updated_at !== site.created_at) {
            events.push({
                id: `site-updated-${site.id}`,
                kind: "site",
                title: `${site.name} updated`,
                description: site.is_active
                    ? "Site details were updated"
                    : "Site was archived",
                occurredAt: site.updated_at,
                href: organizationSlug
                    ? `/organization/sites/${site.id}`
                    : undefined,
            });
        }
    }

    for (const admin of admins) {
        const name =
            [admin.user?.first_name, admin.user?.last_name].filter(Boolean).join(" ") ||
            admin.user?.email ||
            admin.name;
        events.push({
            id: `member-${admin.id}`,
            kind: "member",
            title: `${name || "Administrator"} added`,
            description:
                admin.roles?.map((role) => role.name).join(", ") ||
                admin.role?.name ||
                "Organization administrator",
            occurredAt: admin.created_at,
            href: "/organization/administrators",
        });
    }

    for (const integration of integrations) {
        const occurredAt = integration.updated_at ?? integration.created_at;
        if (!occurredAt) continue;
        events.push({
            id: `integration-${integration.id}`,
            kind: "integration",
            title: `${integration.name} ${integration.enabled ? "connected" : "updated"}`,
            description: integration.enabled
                ? "Integration is active for this organization"
                : integration.configured
                    ? "Integration credentials were updated"
                    : "Integration needs setup",
            occurredAt,
            href: "/organization/integrations",
        });
    }

    return events
        .filter((event) => Boolean(event.occurredAt))
        .sort(
            (left, right) =>
                new Date(right.occurredAt).getTime() -
                new Date(left.occurredAt).getTime(),
        )
        .slice(0, ACTIVITY_LIMIT);
}

export interface SiteDisplayRow {
    site: OrganizationSiteSummary;
    depth: number;
    hasChildren: boolean;
}

/** Flatten the directory hierarchy honouring the caller's expanded rows. */
export function flattenSitesForDisplay(
    sites: OrganizationSiteSummary[],
    expanded: ReadonlySet<string>,
): SiteDisplayRow[] {
    const byParent = new Map<string | null, OrganizationSiteSummary[]>();
    const ids = new Set(sites.map((site) => site.id));
    for (const site of sites) {
        const parent =
            site.parent_site_id && ids.has(site.parent_site_id)
                ? site.parent_site_id
                : null;
        const siblings = byParent.get(parent) ?? [];
        siblings.push(site);
        byParent.set(parent, siblings);
    }
    for (const siblings of Array.from(byParent.values())) {
        siblings.sort((left, right) => left.name.localeCompare(right.name));
    }

    const rows: SiteDisplayRow[] = [];
    const walk = (parent: string | null, depth: number) => {
        for (const site of byParent.get(parent) ?? []) {
            const children = byParent.get(site.id) ?? [];
            rows.push({ site, depth, hasChildren: children.length > 0 });
            if (children.length > 0 && expanded.has(site.id)) {
                walk(site.id, depth + 1);
            }
        }
    };
    walk(null, 0);
    return rows;
}

export function filterSites(
    sites: OrganizationSiteSummary[],
    {
        search,
        status,
        useCase,
    }: {
        search: string;
        status: "all" | "active" | "archived";
        useCase: UseCase | "all";
    },
) {
    const term = search.trim().toLowerCase();
    return sites.filter((site) => {
        if (status === "active" && !site.is_active) return false;
        if (status === "archived" && site.is_active) return false;
        if (useCase !== "all" && site.use_case !== useCase) return false;
        if (!term) return true;
        return [
            site.name,
            site.slug,
            site.address,
            site.parent_site_name ?? "",
            operatingTypeLabel(site.use_case),
        ]
            .join(" ")
            .toLowerCase()
            .includes(term);
    });
}

/** Root Sites available as a parent when creating a Site. */
export function parentSiteOptions(
    sites: OrganizationSiteSummary[],
    excludeIds?: ReadonlySet<string>,
) {
    return sites
        .filter((site) => !excludeIds?.has(site.id))
        .sort((left, right) => left.name.localeCompare(right.name));
}

/** A Site and every Site nested beneath it, for cycle-safe move options. */
export function subtreeSiteIds(
    sites: OrganizationSiteSummary[],
    siteId: string,
): Set<string> {
    const childrenByParent = new Map<string, OrganizationSiteSummary[]>();
    for (const site of sites) {
        if (!site.parent_site_id) continue;
        const siblings = childrenByParent.get(site.parent_site_id) ?? [];
        siblings.push(site);
        childrenByParent.set(site.parent_site_id, siblings);
    }
    const ids = new Set<string>([siteId]);
    const walk = (parentId: string) => {
        for (const child of childrenByParent.get(parentId) ?? []) {
            if (ids.has(child.id)) continue;
            ids.add(child.id);
            walk(child.id);
        }
    };
    walk(siteId);
    return ids;
}

/** Every ancestor Site of the supplied Site. */
export function ancestorSiteIds(
    sites: OrganizationSiteSummary[],
    siteId: string,
): Set<string> {
    const byId = new Map(sites.map((site) => [site.id, site]));
    const ids = new Set<string>();
    let current = byId.get(siteId);
    while (current?.parent_site_id) {
        if (ids.has(current.parent_site_id)) break;
        ids.add(current.parent_site_id);
        current = byId.get(current.parent_site_id);
    }
    return ids;
}

const COMMON_TIMEZONES = [
    "UTC",
    "Africa/Lagos",
    "Africa/Accra",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Nairobi",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Sao_Paulo",
    "America/Toronto",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Europe/Amsterdam",
];

export function timezoneOptions() {
    const detected =
        typeof Intl !== "undefined"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : undefined;
    return Array.from(
        new Set([detected, ...COMMON_TIMEZONES].filter(Boolean) as string[]),
    ).sort((left, right) => left.localeCompare(right));
}

export const importModelLabels: Record<OrganizationImportModel, string> = {
    sites: "Sites",
    places: "Places",
    units: "Units",
    parties: "Parties",
};

export const importModelDescriptions: Record<OrganizationImportModel, string> = {
    sites: "Create Sites, including child Sites, in the organization portfolio.",
    places: "Create buildings, spaces and rooms inside an existing Site.",
    units: "Create units inside a Site, optionally under a parent building.",
    parties: "Attach people or organizations to a Place in this Site.",
};

const ORGANIZATION_TEMPLATES: Record<OrganizationImportModel, string> = {
    sites: [
        "name,parent_site,use_case,address,timezone,description,admin_email,admin_name,admin_phone",
        'Harbour Court,,residential,"19 Marina Road, Lagos",Africa/Lagos,Head office,admin@example.com,Ada Bello,+2348000000000',
        "Harbour Annex,Harbour Court,,1 Annex Road,Africa/Lagos,Annex Site,,",
    ].join("\n"),
    places: [
        "site,parent,name,kind,building_type,address,description",
        'Harbour Court,,Block A,building,apartment_block,"19 Marina Road, Lagos",Residential block',
        "Harbour Court,Block A,Rooftop Space,space,common_area,19 Marina Road,Shared rooftop",
    ].join("\n"),
    units: [
        "site,parent,name,building_type,address,description",
        'Harbour Court,Block A,A101,apartment,"19 Marina Road, Lagos",Two-bedroom apartment',
        "Harbour Court,Block A,A102,studio,19 Marina Road,Studio apartment",
    ].join("\n"),
    parties: [
        "place,display_name,email,phone,role,kind,effective_from,effective_to",
        "A101,Ada Bello,ada@example.com,+2348000000000,tenant,person,,",
    ].join("\n"),
};

const SITE_TEMPLATES: Record<"places" | "units" | "parties", string> = {
    places: [
        "parent,name,kind,building_type,address,description",
        'Block A,building,apartment_block,"19 Marina Road, Lagos",Residential block',
        "Block A,Rooftop Space,space,common_area,19 Marina Road,Shared rooftop",
    ].join("\n"),
    units: [
        "parent,name,building_type,address,description",
        'Block A,A101,apartment,"19 Marina Road, Lagos",Two-bedroom apartment',
        "Block A,A102,studio,19 Marina Road,Studio apartment",
    ].join("\n"),
    parties: [
        "place,display_name,email,phone,role,kind,effective_from,effective_to",
        "A101,Ada Bello,ada@example.com,+2348000000000,tenant,person,,",
    ].join("\n"),
};

export function importTemplateCsv(
    model: OrganizationImportModel,
    scope: "organization" | "site" = "organization",
): string {
    if (scope === "site" && model !== "sites") {
        return SITE_TEMPLATES[model];
    }
    return ORGANIZATION_TEMPLATES[model];
}

export function importTemplateFileName(
    model: OrganizationImportModel,
    scope: "organization" | "site" = "organization",
): string {
    return `${scope === "site" ? "site-" : ""}${model}-import-template.csv`;
}
