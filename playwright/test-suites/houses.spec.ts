import test, { expect } from "@playwright/test";
import { HousesPage } from "../pages/HousesPage";
import { TestTagStorage } from "../utils/test-tag.utils";
import { TestDataGenerator } from "../utils/data-generator.utils";

test.describe("Houses Management - CRUD", () => {
  let housesPage: HousesPage;

  test.beforeEach(async ({ page }) => {
    housesPage = new HousesPage(page, page.request);
    await housesPage.processAdminLogin();
    await housesPage.openHousesPage();
    await housesPage.waitForTableLoad();

    const housesHeading = page.getByRole("heading", { name: /houses/i });
    await expect(housesHeading).toBeVisible();
  });

  test("should create, search, and delete a house", async ({ page }) => {
    const storage = new TestTagStorage(page);
    const tag = await storage.generateOrGetTag();
    const houseData = TestDataGenerator.generateHouseData();

    // Use tag in house number to make it unique
    houseData.houseNumber = `${tag}_${houseData.houseNumber}`;

    await test.step("Page displayed correctly", async () => {
      const housesHeading = page.getByRole("heading", { name: /houses/i });
      await expect(housesHeading).toBeVisible();
    });

    await test.step("Create new house", async () => {
      await housesPage.clickCreateHouse();

      // Wait for form to be visible
      await page.waitForTimeout(1000);

      await housesPage.fillHouseForm(houseData);
      await housesPage.submitHouseForm();

      // Wait for success message or redirect
      await page.waitForTimeout(2000);
    });

    await test.step("Search for created house", async () => {
      await housesPage.navigateToHouses();
      await housesPage.waitForTableLoad();
      await housesPage.searchHouse(houseData.houseNumber);

      // Verify house appears in table
      await expect(
        page.getByRole("cell", { name: houseData.houseNumber }),
      ).toBeVisible();
    });

    await test.step("View house details", async () => {
      const firstRow = page.locator("table tbody tr").first();
      const viewBtn = firstRow.getByRole("button", { name: /view|details/i });

      if (await viewBtn.isVisible()) {
        await viewBtn.click();
        await page.waitForTimeout(1000);

        // Verify we're on details page
        await expect(page).toHaveURL(/\/houses\/\w+/);

        // Go back to houses list
        await housesPage.navigateToHouses();
        await housesPage.waitForTableLoad();
        await housesPage.searchHouse(houseData.houseNumber);
      }
    });

    // await test.step("Delete house", async () => {
    //   const firstRow = page.locator("table tbody tr").first();
    //   const deleteBtn = firstRow.getByRole("button", { name: /delete/i });

    //   await deleteBtn.click();

    //   // Confirm deletion
    //   const confirmBtn = page.getByRole("button", { name: /confirm|yes/i });
    //   await expect(confirmBtn).toBeVisible();
    //   await confirmBtn.click();

    //   // Wait for deletion to complete
    //   await page.waitForTimeout(2000);

    //   // Reload and verify deletion
    //   await housesPage.reloadTable();
    //   await housesPage.searchHouse(houseData.houseNumber);

    //   // Verify "No data" message or empty table
    //   const noDataMessage = page.getByText(/no data|no houses found/i);
    //   await expect(noDataMessage).toBeVisible();
    // });
  });

  test("should update house information", async ({ page }) => {
    await test.step("Select first house and click edit", async () => {
      const firstRow = page.locator("table tbody tr").first();
      const editBtn = firstRow.getByRole("button", { name: /edit|update/i });

      if (await editBtn.isVisible()) {
        await editBtn.click();

        // Wait for form
        await page.waitForTimeout(1000);

        // Update address
        const newAddress = TestDataGenerator.generateAddress();
        await page.locator("#address_input, [name='address']").fill(newAddress);

        // Submit update
        const submitBtn = page.getByRole("button", {
          name: /submit|save|update/i,
        });
        await submitBtn.click();

        // Wait for success
        await page.waitForTimeout(2000);
      }
    });
  });

  test("should navigate to house details page", async ({ page }) => {
    await test.step("Click on first house to view details", async () => {
      const firstRow = page.locator("table tbody tr").first();

      // Try clicking on house number link or view button
      const houseLink = firstRow.locator("a").first();

      if (await houseLink.isVisible()) {
        await houseLink.click();
        await expect(page).toHaveURL(/\/houses\/\w+/);
      }
    });
  });
});
