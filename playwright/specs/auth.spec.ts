import { expect, test } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";
import { installCanonicalApi, seedSession } from "../fixtures/canonical-api";
import { AuthPage } from "../pages/AuthPage";

test.describe("@canonical authentication", () => {
  test("login resolves through organizations and logout returns to auth", async ({
    page,
  }) => {
    await installCanonicalApi(page, { emptyOrganizationIndex: true });
    const auth = new AuthPage(page);

    await auth.openLogin();
    await auth.login();
    await expect(page).toHaveURL(/\/organizations\/?$/);
    await expect(page.getByText("No organizations yet")).toBeVisible();

    await page.goto(`${vmsConfig.tenantURL("harbour")}/organization`);
    await expect(page).toHaveURL(
      new RegExp(`harbour\\.lvh\\.me:${vmsConfig.webPort}`),
    );
    await auth.logout();
  });

  test("invalid credentials stay on login and expose the API error", async ({
    page,
  }) => {
    await page.route("https://vmscore.to/auth/login", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        headers: {
          "access-control-allow-origin": vmsConfig.webBaseURL,
          "access-control-allow-credentials": "true",
        },
        body: JSON.stringify({
          success: false,
          message: "Email or password is incorrect.",
        }),
      }),
    );
    const auth = new AuthPage(page);
    await auth.openLogin();
    await auth.login("wrong@example.com", "wrong-password", false);
    await expect(page).toHaveURL(/\/auth\/login\/?$/);
    await expect(page.getByText(/email or password is incorrect/i)).toBeVisible();
  });

  test("authenticated tenant deep link preserves the requested route", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page);
    const tenant = await seedSession(context);
    await page.goto(`${tenant}/admin/properties`);
    await expect(page).toHaveURL(/\/admin\/properties\/?$/);
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
  });
});
