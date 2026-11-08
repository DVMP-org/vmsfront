import { expect, type Page } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";

export class WorkspacesPage {
  constructor(private readonly page: Page) {}

  async open(slug = "harbour") {
    await this.page.goto(
      `${vmsConfig.tenantURL(slug)}/organization/workspaces`,
    );
    await expect(
      this.page.getByRole("heading", { name: "Choose your workspace" }),
    ).toBeVisible();
  }

  async openManagement() {
    await this.page.getByRole("link", { name: /management console/i }).click();
    await expect(this.page).toHaveURL(/\/admin(?:\/|$)/);
  }

  async expectManagementVisible(visible: boolean) {
    const link = this.page.getByRole("link", { name: /management console/i });
    if (visible) {
      await expect(link).toBeVisible();
    } else {
      await expect(link).toHaveCount(0);
    }
  }
}
