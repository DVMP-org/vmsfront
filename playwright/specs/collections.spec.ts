import { expect, test } from "@playwright/test";

import {
  installCanonicalApi,
  seedSession,
} from "../fixtures/canonical-api";
import { PropertiesPage } from "../pages/PropertiesPage";

function makePlaces(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `place-${index + 1}`,
    parent_id: null,
    name: `Harbour ${String(index + 1).padStart(2, "0")}`,
    slug: `harbour-${index + 1}`,
    kind: index % 2 === 0 ? "site" : "building",
    building_type: null,
    use_case: "mixed_use",
    description: `Property ${index + 1}`,
    address: `${index + 1} Marina Road`,
    is_active: index !== 2,
    updated_at: "2026-11-08T04:20:00Z",
    ancestors: [],
    children: [],
  }));
}

test.describe("@canonical @collections collection behavior", () => {
  test("search, filters, sort, pagination, columns and density work together", async ({
    context,
    page,
  }) => {
    const mobile = test.info().project.name.startsWith("mobile");
    const propertyText = (name: string) =>
      mobile
        ? page
            .getByRole("list", {
              name: "Properties register row summaries",
            })
            .getByText(name, { exact: true })
        : page.getByRole("table").getByText(name, { exact: true });
    await installCanonicalApi(page, { places: makePlaces(12) });
    const tenant = await seedSession(context);
    const properties = new PropertiesPage(page);
    await page.goto(`${tenant}/admin/properties`);
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();

    await page
      .getByPlaceholder("Find a property or space…")
      .fill("Harbour");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(propertyText("Harbour 01")).toBeVisible();

    await page.getByRole("button", { name: "Next page" }).click();
    await expect(
      page.getByText(/Showing 11 to 11 of 11 results/i),
    ).toBeVisible();
    await page.getByRole("button", { name: "1", exact: true }).click();

    await page.getByLabel("Type").selectOption({ label: "Building" });
    await expect(propertyText("Harbour 02")).toBeVisible();
    await expect(propertyText("Harbour 01")).toHaveCount(0);

    await page.getByLabel("Status").selectOption("all");
    await properties.toggleDensity();

    await page.getByLabel("Choose visible columns").click();
    await page.getByRole("checkbox", { name: "Location" }).uncheck();
    await expect(page.getByRole("columnheader", { name: "Location" })).toHaveCount(0);

    if (mobile) {
      await expect(
        page.getByRole("list", { name: "Properties register row summaries" }),
      ).toBeVisible();
    } else {
      await page.getByRole("button", { name: "Sort by Property" }).click();
      await expect(
        page.getByRole("columnheader", { name: "Property" }),
      ).toHaveAttribute("aria-sort", "ascending");
    }

  });

  test("multi-select exposes bulk actions and downloads selected rows", async ({
    context,
    page,
  }) => {
    await installCanonicalApi(page, { places: makePlaces(4) });
    const tenant = await seedSession(context);
    await page.goto(`${tenant}/admin/properties`);

    if (test.info().project.name.startsWith("mobile")) {
      await page
        .getByRole("list", { name: "Properties register row summaries" })
        .getByRole("checkbox", { name: "Select row" })
        .first()
        .check();
    } else {
      await page.getByRole("button", { name: "Select row" }).first().click();
    }
    await expect(page.getByText("1 item selected")).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export selected" }).click();
    expect((await download).suggestedFilename()).toBe("properties.csv");
  });

  test("filtered-empty state offers a deterministic reset", async ({
    context,
    page,
  }) => {
    const mobile = test.info().project.name.startsWith("mobile");
    const emptyText = (text: string) => page.getByText(text);
    await installCanonicalApi(page, { places: makePlaces(2) });
    const tenant = await seedSession(context);
    await page.goto(`${tenant}/admin/properties`);

    await page
      .getByPlaceholder("Find a property or space…")
      .fill("not-a-place");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(
      emptyText("No properties match these filters"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(
      mobile
        ? page
            .getByRole("list", {
              name: "Properties register row summaries",
            })
            .getByText("Harbour 01", { exact: true })
        : page.getByRole("table").getByText("Harbour 01", { exact: true }),
    ).toBeVisible();
  });

  test("empty organization shows the first-use state", async ({
    context,
    page,
  }) => {
    const mobile = test.info().project.name.startsWith("mobile");
    await installCanonicalApi(page, { places: [] });
    const tenant = await seedSession(context);
    await page.goto(`${tenant}/admin/properties`);

    await expect(
      mobile
        ? page
            .getByRole("list", {
              name: "Properties register row summaries",
            })
            .getByText("No properties found")
        : page.getByRole("table").getByText("No properties found"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "New property" }),
    ).toBeVisible();
  });

  test("loading and recoverable-error states replace stale content predictably", async ({
    context,
    page,
  }) => {
    const mobile = test.info().project.name.startsWith("mobile");
    const propertyText = (name: string) =>
      mobile
        ? page
            .getByRole("list", {
              name: "Properties register row summaries",
            })
            .getByText(name, { exact: true })
        : page.getByRole("table").getByText(name, { exact: true });
    await installCanonicalApi(page, { places: makePlaces(2) });
    const tenant = await seedSession(context);
    let failed = false;
    await page.route("https://vmscore.to/admin/places*", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path !== "/admin/places") return route.fallback();
      if (failed) {
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Properties are temporarily unavailable.",
          }),
        });
      }
      return route.fallback();
    });

    await page.goto(`${tenant}/admin/properties`);
    await expect(propertyText("Harbour 01")).toBeVisible();
    failed = true;
    await page
      .getByPlaceholder("Find a property or space…")
      .fill("Harbour");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(
      page.getByText(/last available records remain visible/i),
    ).toBeVisible();
    await expect(propertyText("Harbour 01")).toBeVisible();
    await expect(page.getByRole("button", { name: /retry update/i })).toBeVisible();
  });
});
