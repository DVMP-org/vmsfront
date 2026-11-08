import { expect, type Page } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";

export class PeoplePage {
  constructor(private readonly page: Page) {}

  async open(slug = "harbour") {
    await this.page.goto(`${vmsConfig.tenantURL(slug)}/admin/people`);
    await expect(
      this.page.getByRole("heading", { name: "People", exact: true }),
    ).toBeVisible();
  }

  async openAddPerson() {
    await this.page.getByRole("button", { name: "Add person" }).click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  async addPerson({
    name,
    email,
    phone,
  }: {
    name: string;
    email: string;
    phone?: string;
  }) {
    await this.page.getByLabel("Full name").fill(name);
    await this.page.getByLabel("Email").fill(email);
    if (phone) await this.page.getByLabel("Phone").fill(phone);
    await this.page.getByRole("button", { name: "Add person" }).last().click();
    await expect(this.page.getByText(name, { exact: true }).first()).toBeVisible();
  }
}
