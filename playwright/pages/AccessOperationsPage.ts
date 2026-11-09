import { expect, type Page } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";

export class AccessOperationsPage {
  constructor(private readonly page: Page) {}

  async openInvitations(slug = "harbour") {
    await this.page.goto(`${vmsConfig.tenantURL(slug)}/admin/invitations`);
    await expect(
      this.page.getByRole("heading", { name: "Visitor invitations" }),
    ).toBeVisible();
  }

  async approveFirstInvitation() {
    await this.page.getByRole("button", { name: "Select row" }).first().click();
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.page
      .getByRole("button", { name: "Approve selected" })
      .click();
    await expect(
      this.page.getByText(/invitation.*approved/i).first(),
    ).toBeVisible();
  }

  async openCharges(slug = "harbour") {
    await this.page.goto(`${vmsConfig.tenantURL(slug)}/admin/charges`);
    await expect(
      this.page.getByRole("heading", { name: "Charges", exact: true }),
    ).toBeVisible();
  }

  async createCharge({
    name,
    amount,
  }: {
    name: string;
    amount: string;
  }) {
    await this.page.getByRole("link", { name: "Create charge" }).click();
    await this.page.getByLabel("Name").fill(name);
    await this.page.getByLabel("Amount").fill(amount);
    await this.page.getByRole("button", { name: "Create charge" }).click();
    await expect(this.page.getByRole("heading", { name })).toBeVisible();
  }

  async openGates(slug = "harbour") {
    await this.page.goto(`${vmsConfig.tenantURL(slug)}/admin/gates`);
    await expect(
      this.page.getByRole("heading", { name: "Gates", exact: true }),
    ).toBeVisible();
  }

  async createGate(name: string) {
    await this.page.getByRole("button", { name: "Create gate" }).click();
    await this.page.getByLabel("Gate name").fill(name);
    await this.page.getByRole("button", { name: "Create gate" }).last().click();
    await expect(this.page.getByText(name, { exact: true })).toBeVisible();
  }
}
