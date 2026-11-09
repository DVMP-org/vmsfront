import { expect, type Page } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";

export class AuthPage {
  constructor(private readonly page: Page) {}

  async openLogin() {
    await this.page.goto(`${vmsConfig.webBaseURL}/auth/login`);
    await expect(
      this.page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await this.page.waitForLoadState("networkidle");
  }

  async login(
    email = vmsConfig.adminEmail,
    password = vmsConfig.adminPassword,
    setSessionCookie = true,
  ) {
    await this.page.getByLabel("Work email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    if (setSessionCookie) {
      await this.page.context().addCookies([
        {
          name: "auth-token",
          value: "e2e-token",
          domain: `.${vmsConfig.baseDomain}`,
          path: "/",
          sameSite: "Lax",
        },
      ]);
    }
    await this.page
      .getByRole("button", { name: "Continue to workspace" })
      .click();
  }

  async logout() {
    await this.page
      .getByRole("button", { name: /open account menu/i })
      .click();
    await this.page.getByRole("button", { name: "Sign out" }).click();
    await expect(this.page).toHaveURL(/\/auth\/login\/?(?:\?.*)?$/);
  }
}
