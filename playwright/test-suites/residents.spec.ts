import test, { expect } from "@playwright/test";
import { ResidentsPage } from "../pages/ResidentsPage";
import { TestTagStorage } from "../utils/test-tag.utils";
import { TestDataGenerator } from "../utils/data-generator.utils";

test.describe("Residents Management - CRUD", () => {
  let residentsPage: ResidentsPage;

  test.beforeEach(async ({ page }) => {
    residentsPage = new ResidentsPage(page, page.request);
    await residentsPage.processAdminLogin();
    await residentsPage.openResidentsPage();
    await residentsPage.waitForTableLoad();

    const residentsHeading = page.getByRole("heading", {
      name: /residents/i,
    });
    await expect(residentsHeading).toBeVisible();
  });

  test("should create, search, and delete a resident", async ({ page }) => {
    const storage = new TestTagStorage(page);
    const tag = await storage.generateOrGetTag();
    const residentData = TestDataGenerator.generateResidentData();

    // Use tag in email to make it unique and searchable
    residentData.email = `${tag}@test.com`;

    await test.step("Page displayed correctly", async () => {
      const residentsHeading = page.getByRole("heading", {
        name: /residents/i,
      });
      await expect(residentsHeading).toBeVisible();
    });

    await test.step("Create new resident", async () => {
      await residentsPage.clickCreateResident();

      // Wait for form to be visible
      await page.waitForTimeout(1000);

      await residentsPage.fillResidentForm(residentData);
      await residentsPage.submitResidentForm();

      // Wait for success message or redirect
      await page.waitForTimeout(2000);
    });

    await test.step("Search for created resident", async () => {
      await residentsPage.navigateToResidents();
      await residentsPage.waitForTableLoad();
      await residentsPage.searchResident(residentData.email);

      // Verify resident appears in table
      await expect(
        page.getByRole("cell", { name: residentData.email }),
      ).toBeVisible();
    });

    await test.step("Delete resident", async () => {
      const firstRow = page.locator("table tbody tr").first();
      const deleteBtn = firstRow.getByRole("button", { name: /delete/i });

      await deleteBtn.click();

      // Confirm deletion
      const confirmBtn = page.getByRole("button", { name: /confirm|yes/i });
      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // Wait for deletion to complete
      await page.waitForTimeout(2000);

      // Reload and verify deletion
      await residentsPage.reloadTable();
      await residentsPage.searchResident(residentData.email);

      // Verify "No data" message or empty table
      const noDataMessage = page.getByText(/no data|no residents found/i);
      await expect(noDataMessage).toBeVisible();
    });
  });

  test("should view resident details", async ({ page }) => {
    await test.step("Click on first resident in table", async () => {
      const firstRow = page.locator("table tbody tr").first();
      const viewBtn = firstRow.getByRole("button", { name: /view|details/i });

      if (await viewBtn.isVisible()) {
        await viewBtn.click();

        // Verify navigation to details page
        await expect(page).toHaveURL(/\/residents\/\w+/);
      }
    });
  });

  test("should filter residents by house", async ({ page }) => {
    await test.step("Apply house filter", async () => {
      // Look for house filter dropdown/select
      const houseFilter = page.locator("#house_filter, [name='house']").first();

      if (await houseFilter.isVisible()) {
        await houseFilter.click();

        // Select first option
        const firstOption = page.getByRole("option").first();
        await firstOption.click();

        await residentsPage.waitForTableLoad();
      }
    });
  });
});
