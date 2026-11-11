import { describe, expect, it } from "vitest";

import type { OrganizationSiteSummary } from "./api";
import {
    ancestorSiteIds,
    buildActivityFeed,
    buildPortfolioMetrics,
    filterSites,
    flattenSitesForDisplay,
    importTemplateCsv,
    importTemplateFileName,
    operatingTypeLabel,
    parentSiteOptions,
    subtreeSiteIds,
} from "./lib";
import type { Admin } from "@/types";
import type { Integration } from "@/types/integration";

const site = (
    overrides: Partial<OrganizationSiteSummary> &
        Pick<OrganizationSiteSummary, "id" | "name">,
): OrganizationSiteSummary => ({
    organization_id: "org-1",
    parent_site_id: null,
    parent_site_name: null,
    slug: overrides.name.toLowerCase().replaceAll(" ", "-"),
    use_case: "residential",
    description: null,
    address: "",
    timezone: "UTC",
    is_active: true,
    place_count: 0,
    child_site_count: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
});

describe("organization workspace helpers", () => {
    it("provides organization and Site import templates", () => {
        expect(importTemplateCsv("sites")).toContain("parent_site");
        expect(importTemplateCsv("parties")).toContain("display_name");
        expect(importTemplateCsv("units", "site")).not.toContain("site,");
        expect(importTemplateFileName("units", "site")).toBe(
            "site-units-import-template.csv",
        );
    });

    it("flattens only expanded branches of the Site hierarchy", () => {
        const parent = site({ id: "parent", name: "Harbour Group" });
        const child = site({
            id: "child",
            name: "Harbour Annex",
            parent_site_id: "parent",
            parent_site_name: "Harbour Group",
        });

        expect(
            flattenSitesForDisplay([child, parent], new Set()).map((row) => row.site.id),
        ).toEqual(["parent"]);
        expect(
            flattenSitesForDisplay([child, parent], new Set(["parent"])).map((row) => ({
                id: row.site.id,
                depth: row.depth,
            })),
        ).toEqual([
            { id: "parent", depth: 0 },
            { id: "child", depth: 1 },
        ]);
    });

    it("filters by search, status and operating type", () => {
        const active = site({ id: "a", name: "Harbour Residences" });
        const archived = site({
            id: "b",
            name: "Harbour Offices",
            use_case: "commercial",
            is_active: false,
        });

        expect(filterSites([active, archived], {
            search: "residences",
            status: "all",
            useCase: "all",
        })).toHaveLength(1);
        expect(filterSites([active, archived], {
            search: "",
            status: "archived",
            useCase: "all",
        }).map((item) => item.id)).toEqual(["b"]);
        expect(filterSites([active, archived], {
            search: "",
            status: "all",
            useCase: "commercial",
        }).map((item) => item.id)).toEqual(["b"]);
        expect(operatingTypeLabel("mixed_use")).toBe("Mixed-use");
    });

    it("excludes a Site and its descendants from move targets", () => {
        const root = site({ id: "root", name: "Root" });
        const child = site({
            id: "child",
            name: "Child",
            parent_site_id: "root",
            parent_site_name: "Root",
        });
        const grandchild = site({
            id: "grandchild",
            name: "Grandchild",
            parent_site_id: "child",
            parent_site_name: "Child",
        });
        const sibling = site({ id: "sibling", name: "Sibling" });
        const sites = [root, child, grandchild, sibling];

        expect([...subtreeSiteIds(sites, "root")].sort()).toEqual([
            "child",
            "grandchild",
            "root",
        ]);
        expect(
            parentSiteOptions(sites, subtreeSiteIds(sites, "root")).map(
                (item) => item.id,
            ),
        ).toEqual(["sibling"]);
    });

    it("walks the ancestor Site chain for manager selection", () => {
        const root = site({ id: "root", name: "Root" });
        const child = site({
            id: "child",
            name: "Child",
            parent_site_id: "root",
            parent_site_name: "Root",
        });
        const grandchild = site({
            id: "grandchild",
            name: "Grandchild",
            parent_site_id: "child",
            parent_site_name: "Child",
        });

        expect(
            [...ancestorSiteIds([root, child, grandchild], "grandchild")].sort(),
        ).toEqual(["child", "root"]);
    });

    it("sums the portfolio and counts active integrations", () => {
        const metrics = buildPortfolioMetrics({
            sites: [
                site({ id: "a", name: "A", place_count: 3 }),
                site({ id: "b", name: "B", place_count: 4 }),
            ],
            organization: { members_count: 7 } as never,
            integrations: [
                { id: "i1", enabled: true },
                { id: "i2", enabled: false },
            ] as unknown as Integration[],
        });

        expect(metrics).toEqual({
            totalSites: 2,
            totalPlaces: 7,
            totalMembers: 7,
            activeIntegrations: 1,
        });
    });

    it("orders administrative activity newest first", () => {
        const events = buildActivityFeed({
            sites: [
                site({
                    id: "site-1",
                    name: "Harbour Residences",
                    created_at: "2026-01-01T00:00:00Z",
                }),
            ],
            admins: [
                {
                    id: "admin-1",
                    created_at: "2026-02-01T00:00:00Z",
                    user: { first_name: "Ada", last_name: "Bello", email: "ada@example.com" },
                    roles: [],
                } as unknown as Admin,
            ],
            integrations: [
                {
                    id: "integration-1",
                    name: "Slack",
                    enabled: true,
                    configured: true,
                    updated_at: "2026-03-01T00:00:00Z",
                } as Integration,
            ],
            organizationSlug: "harbour",
        });

        expect(events[0].kind).toBe("integration");
        expect(events[events.length - 1]?.kind).toBe("site");
    });
});
