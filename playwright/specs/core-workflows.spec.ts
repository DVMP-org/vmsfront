import { expect, test } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";
import {
  installCanonicalApi,
  seedSession,
} from "../fixtures/canonical-api";
import { AccessOperationsPage } from "../pages/AccessOperationsPage";
import { PeoplePage } from "../pages/PeoplePage";
import { PropertiesPage } from "../pages/PropertiesPage";

test.describe("@canonical @workflows persisted domain workflows", () => {
  test("property create, edit, move and archive routes operate on canonical Places", async ({
    context,
    page,
  }) => {
    const api = await installCanonicalApi(page);
    const tenant = await seedSession(context);
    const properties = new PropertiesPage(page);

    await properties.open();
    await properties.openCreate();
    await properties.fillCreateForm({
      name: "Riverside Warehouse",
      address: "12 Riverside Way",
      description: "Distribution site",
    });
    await properties.submitCreate();
    await expect(page).toHaveURL(/\/admin\/properties\/?$/);
    await properties.expectRow("Riverside Warehouse");
    expect(api.mutations).toContain("place.create");

    await page.goto(`${tenant}/admin/properties/place-harbour/edit`);
    await page.getByLabel("Property name").fill("Harbour Court Updated");
    await page.getByRole("button", { name: "Save details" }).click();
    await expect(page.getByText("Harbour Court Updated").first()).toBeVisible();
    expect(api.mutations).toContain("place.update");

    await page.goto(`${tenant}/admin/properties/place-harbour/move`);
    await expect(
      page.getByRole("heading", { name: /move property/i }),
    ).toBeVisible();

    await page.goto(`${tenant}/admin/properties/place-harbour`);
    await page.getByRole("button", { name: "Archive property" }).click();
    await page.getByRole("button", { name: "Archive property" }).last().click();
    expect(api.mutations).toContain("place.archive");
  });

  test("people invitation creates a relationship and queues onboarding", async ({
    context,
    page,
  }) => {
    const api = await installCanonicalApi(page);
    await seedSession(context);
    const people = new PeoplePage(page);

    await people.open();
    await people.openAddPerson();
    await people.addPerson({
      name: "Tunde Balogun",
      email: "tunde.e2e@example.com",
      phone: "+2348000000000",
    });

    expect(api.mutations).toContain("place.person.add");
    await expect(page.getByText("Tunde Balogun", { exact: true })).toBeVisible();
  });

  test("visitor invitation can be selected and approved in bulk", async ({
    context,
    page,
  }) => {
    const api = await installCanonicalApi(page);
    await seedSession(context);
    const access = new AccessOperationsPage(page);

    await access.openInvitations();
    await access.approveFirstInvitation();

    expect(api.mutations).toContain("invitation.approve");
    await expect(page.getByText("Approved", { exact: true }).first()).toBeVisible();
  });

  test("charge definition creation opens the canonical definition route", async ({
    context,
    page,
  }) => {
    const api = await installCanonicalApi(page);
    await seedSession(context);
    const access = new AccessOperationsPage(page);

    await access.openCharges();
    await access.createCharge({
      name: "Quarterly facilities charge",
      amount: "45000",
    });

    expect(api.mutations).toContain("charge.definition.create");
    await expect(page).toHaveURL(/\/admin\/charges\/definitions\/charge-/);
  });

  test("gate creation updates the organization gate register", async ({
    context,
    page,
  }) => {
    const api = await installCanonicalApi(page);
    await seedSession(context);
    const access = new AccessOperationsPage(page);

    await access.openGates();
    await page.getByRole("button", { name: "Create gate" }).click();
    const dialog = page.getByRole("dialog", { name: "Create gate" });
    await dialog.getByLabel("Gate name").fill("Service Gate");
    await dialog.getByLabel("Gate administrators").click();
    await page.getByRole("option", { name: /Ada Okafor/ }).click();
    await dialog.getByRole("button", { name: "Create gate" }).click();

    expect(api.mutations).toContain("gate.create");
    await expect(page.getByText("Service Gate", { exact: true })).toBeVisible();
  });

  test("account menu exposes avatar, search, profile and organization switching", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page);
    const tenant = await seedSession(context);

    await page.goto(`${tenant}/admin/properties`);
    await expect(
      page.getByRole("button", { name: /open account menu for ada okafor/i }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /open account menu for ada okafor/i })
      .click();
    await expect(page.getByText("Account settings")).toBeVisible();
    await expect(page.getByText("Switch organization")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /search vms core/i }),
    ).toBeVisible();
  });
});
