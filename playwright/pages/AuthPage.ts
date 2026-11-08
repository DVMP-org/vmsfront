import { expect, type Page } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";

export class AuthPage {
  constructor(private readonly page: Page) {}

  async openLogin() {
    await this.page.goto(`${vmsConfig.webBaseURL}/auth/login`);
    await expect(
      this.page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
  }

  async login(email = vmsConfig.adminEmail, password = vmsConfig.adminPassword) {
    await this.page.getByLabel("Email Address").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Sign In" }).click();
  }

  async logout() {
    await this.page
      .getByRole("button", { name: /open account menu/i })
      .click();
    await this.page.getByRole("button", { name: "Sign out" }).click();
    await expect(this.page).toHaveURL(/\/auth\/login\/?$/);
  }
}
