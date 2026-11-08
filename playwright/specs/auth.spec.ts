import { expect, test } from "@playwright/test";

import { installCanonicalApi, seedSession } from "../fixtures/canonical-api";
import { AuthPage } from "../pages/AuthPage";

test.describe("@canonical authentication", () => {
  test("login resolves through organizations and logout returns to auth", async ({
    page,
  }) => {
    await installCanonicalApi(page);
    const auth = new AuthPage(page);

    await auth.openLogin();
    await auth.login();
    await expect(page).toHaveURL(/\/organizations\/?$/);
    await expect(page.getByText("Your organizations")).toBeVisible();

    await page.getByRole("link", { name: /harbour operations/i }).click();
    await expect(page).toHaveURL(/harbour\.lvh\.me:3106/);
    await auth.logout();
  });

  test("invalid credentials stay on login and expose the API error", async ({
    page,
  }) => {
    await page.route("https://vmscore.to/auth/login", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Email or password is incorrect.",
        }),
      }),
    );
    const auth = new AuthPage(page);
    await auth.openLogin();
    await auth.login("wrong@example.com", "wrong-password");
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
