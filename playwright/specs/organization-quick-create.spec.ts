import { expect, test } from "@playwright/test";

import {
  installCanonicalApi,
  seedSession,
} from "../fixtures/canonical-api";

test("organization quick create opens the Site drawer", async ({
  context,
  page,
}, testInfo) => {
  await installCanonicalApi(page);
  const tenant = await seedSession(context);

  await page.goto(`${tenant}/organization/sites`);
  const search = page.getByRole("button", {
    name: "Search organization pages",
  });
  await expect(search).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Organization settings" }),
  ).toBeVisible();
  if (testInfo.project.name.startsWith("desktop")) {
    await expect(page.getByText("Harbour Operations").first()).toBeVisible();
  }
  await search.click();
  const searchDialog = page.getByRole("dialog", { name: "Go to a page" });
  await expect(searchDialog).toBeVisible();
  await expect(searchDialog.getByRole("option", { name: /Sites/ })).toBeVisible();
  await searchDialog.getByRole("button", { name: "Close navigation" }).click();

  const trigger = page.getByRole("button", { name: "Create a resource" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const menu = page.getByRole("menu", { name: "Create a resource" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveCount(3);
  await page.screenshot({
    path: testInfo.outputPath("organization-quick-create.png"),
    fullPage: true,
  });

  await menu.getByRole("menuitem", { name: /Site Add/ }).click();
  await expect(page).toHaveURL(/\/organization\/sites\/?\?create=site$/);
  await expect(page.getByRole("dialog", { name: "Create Site" })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("organization-create-site-drawer.png"),
    fullPage: true,
  });
});
