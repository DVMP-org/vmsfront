import { expect, test } from "@playwright/test";

import {
  installCanonicalApi,
  seedSession,
} from "../fixtures/canonical-api";
import { WorkspacesPage } from "../pages/WorkspacesPage";

test.describe("@canonical @permissions management and tenant boundaries", () => {
  test("site administrator can enter the management workspace", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { role: "admin" });
    const tenant = await seedSession(context);

    await page.goto(`${tenant}/admin`);
    await expect(page).toHaveURL(/\/admin(?:\/properties)?\/?$/);
    await expect(
      page.getByRole("navigation", { name: /workspace navigation|main/i }),
    ).toBeVisible();
  });

  test("occupant cannot enter management and sees no management workspace", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { role: "occupant" });
    const tenant = await seedSession(context);
    const workspaces = new WorkspacesPage(page);

    await workspaces.open();
    await workspaces.expectManagementVisible(false);
    await page.goto(`${tenant}/admin`);
    await expect(page).toHaveURL(/\/organization\?reason=management-required/);
  });

  test("guest workspace remains personal and excludes management controls", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { role: "guest" });
    await seedSession(context);
    const workspaces = new WorkspacesPage(page);

    await workspaces.open();
    await expect(page.getByText(/personal access/i).first()).toBeVisible();
    await workspaces.expectManagementVisible(false);
  });

  test("cross-tenant organization access fails closed", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { slug: "foreign" });
    const tenant = await seedSession(context, { slug: "foreign" });
    await page.route("https://vmscore.to/organizations/foreign", (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "You are not a member of this organization.",
        }),
      }),
    );

    await page.goto(`${tenant}/organization`);

    await expect(
      page.getByRole("heading", { name: "Access Denied" }),
    ).toBeVisible();
    await expect(page.getByText(/not a member/i)).toBeVisible();
  });

  test("inactive membership fails closed without rendering organization data", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page);
    const tenant = await seedSession(context);
    await page.route("https://vmscore.to/organizations/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );

    await page.goto(`${tenant}/organization`);

    await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
    await expect(page.getByText("Harbour Operations")).toHaveCount(0);
  });

  test("plugins and integrations are organization-wide admin configuration", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page);
    const tenant = await seedSession(context);

    await page.goto(`${tenant}/admin/plugins`);
    await expect(page.getByRole("heading", { name: "Plugins" })).toBeVisible();
    await expect(page.getByText(/shared by all places/i).first()).toBeVisible();

    await page.goto(`${tenant}/admin/integrations`);
    await expect(
      page.getByRole("heading", { name: "Integrations" }),
    ).toBeVisible();
    await expect(page.getByText(/all places/i).first()).toBeVisible();
  });
});
