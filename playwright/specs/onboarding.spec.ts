import { expect, test } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";
import {
  installCanonicalApi,
  seedSession,
} from "../fixtures/canonical-api";
import { AuthPage } from "../pages/AuthPage";
import { OrganizationSetupPage } from "../pages/OrganizationSetupPage";

test.describe("@canonical @onboarding authoritative first-run flow", () => {
  test("login → organizations → create organization → plan → first place → Workspaces", async ({
    page,
  }) => {
    await installCanonicalApi(page, { emptyOrganizationIndex: true });
    const auth = new AuthPage(page);
    const setup = new OrganizationSetupPage(page);
    const slug = "harbour";

    await test.step("Authenticate on the base domain", async () => {
      await auth.openLogin();
      await auth.login();
      await expect(page).toHaveURL(/\/organizations\/?$/);
    });

    await test.step("Create the organization", async () => {
      await setup.createOrganization({
        name: "Harbour Operations",
        slug,
      });
      await expect(page).toHaveURL(
        new RegExp(
          `harbour\\.${vmsConfig.baseDomain}:${vmsConfig.webPort}/plans`,
        ),
      );
    });

    await test.step("Activate the plan", async () => {
      await setup.activateFreePlan();
      await expect(page).toHaveURL(
        new RegExp(
          `harbour\\.${vmsConfig.baseDomain}:${vmsConfig.webPort}/setup/first-place`,
        ),
      );
      await setup.expectStandaloneSetupShell();
    });

    await test.step("Create the first place", async () => {
      await setup.createFirstPlace({
        name: "Harbour Court",
        address: "19 Marina Road, Lagos",
        description: "Mixed-use waterfront operations",
      });
      await expect(
        page.getByRole("heading", { name: "Choose your workspace" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /management console/i }),
      ).toBeVisible();
    });
  });

  test("standalone setup survives reload and keeps the admin shell absent", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { needsFirstSite: true });
    const tenant = await seedSession(context, { needsFirstSite: true });
    const setup = new OrganizationSetupPage(page);

    await page.goto(`${tenant}/setup/first-place`);
    await setup.expectStandaloneSetupShell();
    await page.reload();
    await setup.expectStandaloneSetupShell();
    await expect(
      page.getByRole("link", { name: "Back to plan" }),
    ).toHaveAttribute("href", "/plans/?setup=first-workspace");
  });

  test("retired admin setup URL redirects before management guards", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { needsFirstSite: true });
    const tenant = await seedSession(context, { needsFirstSite: true });

    await page.goto(
      `${tenant}/admin/properties/new/?setup=first-place`,
    );

    await expect(page).toHaveURL(/\/setup\/first-place\/?$/);
    await expect(
      page.getByRole("heading", { name: "Create your first place" }),
    ).toBeVisible();
    await expect(page.getByText("Property workspace")).toHaveCount(0);
  });

  test("admin entry without a place redirects to standalone setup", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { needsFirstSite: true });
    const tenant = await seedSession(context, { needsFirstSite: true });

    await page.goto(`${tenant}/admin`);

    await expect(page).toHaveURL(/\/setup\/first-place\/?$/);
    await expect(
      page.getByRole("heading", { name: "Create your first place" }),
    ).toBeVisible();
  });

  test("organization-only member with a place cannot enter management", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { role: "member" });
    const tenant = await seedSession(context);

    await page.goto(`${tenant}/admin`);

    await expect(page).toHaveURL(
      /\/organization\/?\?reason=management-required/,
    );
    await expect(
      page.getByRole("heading", { name: "Harbour Operations" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Administration" }),
    ).toHaveCount(0);
  });

  test("completed setup directs the user back to Workspaces", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { needsFirstSite: false });
    const tenant = await seedSession(context);

    await page.goto(`${tenant}/setup/first-place`);

    await expect(
      page.getByText("Your organization already has a place"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open Workspaces" }),
    ).toHaveAttribute("href", "/organization/workspaces/");
  });
});
