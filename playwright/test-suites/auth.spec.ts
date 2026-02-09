import test, { expect } from "@playwright/test";
import { AuthPage } from "../pages/AuthPage";
import { vmsConfig } from "../configs/vms.config";

test.describe("Authentication Tests", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page, page.request);
  });

  test("should successfully login with valid admin credentials", async ({
    page,
  }) => {
    await test.step("Navigate to login page", async () => {
      await authPage.navigateToLogin();
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    await test.step("Verify login form is displayed", async () => {
      await expect(page.locator("#login_email_input")).toBeVisible();
      await expect(page.locator("#login_password_input")).toBeVisible();
      await expect(page.locator("#login_submit_button")).toBeVisible();
    });

    await test.step("Login with admin credentials", async () => {
      await authPage.login(vmsConfig.adminEmail, vmsConfig.adminPassword);
    });

    await test.step("Verify successful login and redirect", async () => {
      await authPage.verifyLoggedIn();
      await expect(page).not.toHaveURL(/\/auth\/login/);
    });
  });

  test("should display error with invalid credentials", async ({ page }) => {
    await test.step("Navigate to login page", async () => {
      await authPage.navigateToLogin();
    });

    await test.step("Attempt login with invalid credentials", async () => {
      await page.locator("#login_email_input").fill("invalid@test.com");
      await page.locator("#login_password_input").fill("WrongPassword123!");
      await page.locator("#login_submit_button").click();
    });

    await test.step("Verify error message is displayed", async () => {
      // Wait for error message (adjust selector based on your app)
      const errorMessage = page.getByText(
        "User not found, please register your account",
        { exact: false },
      );
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });

  test("should navigate to forgot password page", async ({ page }) => {
    await test.step("Navigate to login page", async () => {
      await authPage.navigateToLogin();
    });

    await test.step("Click forgot password link", async () => {
      const forgotPasswordLink = page.getByRole("link", {
        name: /forgot.*password/i,
      });
      await forgotPasswordLink.click();
    });

    await test.step("Verify navigation to forgot password page", async () => {
      await expect(page).toHaveURL(/\/auth\/forgot-password/);
    });
  });

  test("should logout successfully", async ({ page }) => {
    await test.step("Login first", async () => {
      await authPage.login();
      await authPage.verifyLoggedIn();
    });

    await test.step("Perform logout", async () => {
      await authPage.logout();
    });

    await test.step("Verify redirect to login page", async () => {
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });
});
