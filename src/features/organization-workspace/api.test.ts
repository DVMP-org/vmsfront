import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";

import { organizationWorkspaceApi } from "./api";

vi.mock("@/lib/api-client", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe("organization workspace API", () => {
    beforeEach(() => vi.clearAllMocks());

    it("creates Sites through the organization portfolio endpoint", async () => {
        vi.mocked(apiClient.post).mockResolvedValue({
            data: { id: "site-1", name: "Harbour" },
        });

        await organizationWorkspaceApi.createSite("mitar", {
            name: "Harbour",
            use_case: "residential",
            parent_site_id: null,
        });

        expect(apiClient.post).toHaveBeenCalledWith(
            "/organizations/mitar/sites",
            expect.objectContaining({ name: "Harbour" }),
        );
    });

    it("reads one Site from the organization portfolio", async () => {
        vi.mocked(apiClient.get).mockResolvedValue({ data: { id: "site-1" } });

        await organizationWorkspaceApi.site("mitar", "site-1");

        expect(apiClient.get).toHaveBeenCalledWith(
            "/organizations/mitar/sites/site-1",
        );
    });

    it("moves and archives Sites through organization actions", async () => {
        vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "site-1" } });

        await organizationWorkspaceApi.moveSite("mitar", "site-1", null);
        await organizationWorkspaceApi.setSiteActive("mitar", "site-1", false);

        expect(apiClient.post).toHaveBeenCalledWith(
            "/organizations/mitar/sites/site-1/move",
            { parent_site_id: null },
        );
        expect(apiClient.post).toHaveBeenCalledWith(
            "/organizations/mitar/sites/site-1/archive",
        );
    });

    it("uploads organization imports as multipart CSV", async () => {
        vi.mocked(apiClient.post).mockResolvedValue({
            data: { successful: 1, failed: 0, total: 1, results: [] },
        });
        const file = new File(["name\nHarbour Court"], "sites.csv", {
            type: "text/csv",
        });

        await organizationWorkspaceApi.importModels("mitar", "sites", file);

        expect(apiClient.post).toHaveBeenCalledWith(
            "/organizations/mitar/imports/sites",
            expect.any(FormData),
            { headers: { "Content-Type": "multipart/form-data" } },
        );
    });

    it("uploads Site manager imports to the Site endpoint", async () => {
        vi.mocked(apiClient.post).mockResolvedValue({
            data: { successful: 1, failed: 0, total: 1, results: [] },
        });
        const file = new File(["name\nA101"], "units.csv", {
            type: "text/csv",
        });

        await organizationWorkspaceApi.importSiteModels("site-1", "units", file);

        expect(apiClient.post).toHaveBeenCalledWith(
            "/admin/sites/site-1/imports/units",
            expect.any(FormData),
            { headers: { "Content-Type": "multipart/form-data" } },
        );
    });

    it("lists organization managers with an optional Site filter", async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            data: { managers: [], total: 0 },
        });

        await organizationWorkspaceApi.managers("mitar", "site-1");

        expect(apiClient.get).toHaveBeenCalledWith(
            "/organizations/mitar/managers",
            { params: { site_id: "site-1" } },
        );
    });

    it("adds, re-roles and removes organization managers", async () => {
        vi.mocked(apiClient.post).mockResolvedValue({
            data: { assignment_id: "assignment-1" },
        });
        vi.mocked(apiClient.patch).mockResolvedValue({
            data: { assignment_id: "assignment-1" },
        });
        vi.mocked(apiClient.delete).mockResolvedValue({
            data: { assignment_id: "assignment-1" },
        });

        await organizationWorkspaceApi.addManager("mitar", {
            site_id: "site-1",
            email: "ada@example.com",
        });
        await organizationWorkspaceApi.replaceManagerRoles(
            "mitar",
            "assignment-1",
            ["role-1"],
        );
        await organizationWorkspaceApi.removeManager("mitar", "assignment-1");

        expect(apiClient.post).toHaveBeenCalledWith(
            "/organizations/mitar/managers",
            expect.objectContaining({ site_id: "site-1" }),
        );
        expect(apiClient.patch).toHaveBeenCalledWith(
            "/organizations/mitar/managers/assignment-1/roles",
            { role_ids: ["role-1"] },
        );
        expect(apiClient.delete).toHaveBeenCalledWith(
            "/organizations/mitar/managers/assignment-1",
        );
    });
});
