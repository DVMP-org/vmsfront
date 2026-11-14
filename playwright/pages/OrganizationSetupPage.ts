import { expect, type Page } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";

export class OrganizationSetupPage {
  constructor(private readonly page: Page) {}

  async login(email = vmsConfig.adminEmail, password = vmsConfig.adminPassword) {
    await this.page.goto(`${vmsConfig.webBaseURL}/auth/login`);
    await this.page.getByLabel("Email Address").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Sign In" }).click();
    await expect(this.page).toHaveURL(/\/organizations\/?$/);
  }

  async openOrganizationIndex() {
    await this.page.goto(`${vmsConfig.webBaseURL}/organizations`);
    await expect(
      this.page.getByRole("heading", { name: /welcome|organizations/i }).first(),
    ).toBeVisible();
  }

  async createOrganization({
    name,
    slug,
    useCase = "Mixed use",
  }: {
    name: string;
    slug: string;
    useCase?: string;
  }) {
    await this.page
      .getByRole("button", { name: /(new|create).*organization/i })
      .click();
    await expect(this.page).toHaveURL(/\/organizations\/create\/?$/);
    await this.page.getByLabel("Operating use case").selectOption({
      label: useCase,
    });
    await this.page.getByLabel("Organization name").fill(name);
    const workspaceUrl = this.page.getByLabel("Workspace URL");
    if (await workspaceUrl.isVisible()) {
      await workspaceUrl.fill(slug);
    }
    await this.page
      .getByRole("button", { name: /continue to plan/i })
      .click();
    await expect(this.page).toHaveURL(
      new RegExp(`${slug}\\.${vmsConfig.baseDomain}.*\\/plans`),
    );
  }

  async activateFreePlan() {
    await this.page
      .getByRole("button", { name: /activate( free plan| and continue)/i })
      .click();
    await expect(this.page).toHaveURL(
      new RegExp(
        `${vmsConfig.baseDomain}.*\\/setup\\/first-site\\/?$`,
      ),
    );
  }

  async createFirstSite({
    name,
    address,
    description,
  }: {
    name: string;
    address: string;
    description?: string;
  }) {
    await expect(
      this.page.getByRole("heading", { name: "Create your first Site" }),
    ).toBeVisible();
    await this.page.getByLabel("Site name").fill(name);
    await this.page.getByLabel("Address").fill(address);
    if (description) {
      await this.page.getByLabel("Description").fill(description);
    }
    await this.page
      .getByRole("button", { name: "Create first Site" })
      .click();
    await expect(
      this.page.getByRole("heading", { name: "Choose your workspace" }),
    ).toBeVisible({ timeout: 30_000 });
  }

  async expectStandaloneSetupShell() {
    await expect(
      this.page.getByRole("heading", { name: "Create your first Site" }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("navigation", { name: "Administration" }),
    ).toHaveCount(0);
    await expect(this.page.getByText("Property workspace")).toHaveCount(0);
  }
}
