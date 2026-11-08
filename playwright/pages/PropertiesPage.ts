import { expect, type Page } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";

export class PropertiesPage {
  constructor(private readonly page: Page) {}

  async open(slug = "harbour") {
    await this.page.goto(`${vmsConfig.tenantURL(slug)}/admin/properties`);
    await expect(
      this.page.getByRole("heading", { name: "Properties", exact: true }),
    ).toBeVisible();
  }

  async openCreate() {
    await this.page.getByRole("link", { name: /new property/i }).click();
    await expect(this.page).toHaveURL(/\/admin\/properties\/new\/?$/);
  }

  async fillCreateForm({
    name,
    address,
    description,
  }: {
    name: string;
    address?: string;
    description?: string;
  }) {
    await this.page.getByLabel("Property name").fill(name);
    if (address) await this.page.getByLabel("Address").fill(address);
    if (description) {
      await this.page.getByLabel("Description").fill(description);
    }
  }

  async submitCreate() {
    await this.page.getByRole("button", { name: "Create property" }).click();
  }

  async search(query: string) {
    const search = this.page.getByRole("textbox", {
      name: /find a property|search properties/i,
    });
    await search.fill(query);
    await search.press("Enter");
    await expect(this.page.getByText(/matching/i)).toBeVisible();
  }

  async expectRow(name: string) {
    await expect(this.page.getByText(name, { exact: true }).first()).toBeVisible();
  }

  async selectColumns(...labels: string[]) {
    await this.page.getByText("Columns", { exact: true }).click();
    for (const label of labels) {
      await this.page.getByRole("checkbox", { name: label }).uncheck();
    }
  }

  async toggleDensity() {
    await this.page
      .getByRole("button", { name: /use compact row density/i })
      .click();
  }
}
