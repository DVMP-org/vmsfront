const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const origin = "http://oh03-audit.localhost:3103";
const evidenceDir = __dirname;
const organization = {
  id: "org-harbour",
  name: "Harbour Operations",
  slug: "oh03-audit",
  use_case: "mixed_use",
  description: "Property operations acceptance fixture",
};
const user = {
  id: "user-oh03",
  email: "oh03.audit@example.com",
  first_name: "Ada",
  last_name: "Okafor",
  is_verified: true,
};
const admin = {
  id: "admin-oh03",
  user,
  name: "Ada Okafor",
  role_id: null,
  permissions: null,
  role: null,
  effective_permissions: ["*"],
  created_at: "2026-11-08T00:00:00Z",
  updated_at: "2026-11-08T00:00:00Z",
};
const places = [
  {
    id: "place-harbour-court",
    parent_id: null,
    name: "Harbour Court",
    kind: "site",
    building_type: null,
    use_case: null,
    description: "Mixed-use waterfront property",
    address: "19 Marina Road, Lagos",
    is_active: true,
    updated_at: "2026-11-08T04:20:00Z",
  },
  {
    id: "place-observation",
    parent_id: null,
    name: "North Observation House",
    kind: "site",
    building_type: null,
    use_case: "residential",
    description: null,
    address: "8 Ridge Avenue, Lagos",
    is_active: true,
    updated_at: "2026-11-08T03:10:00Z",
  },
  {
    id: "place-offices",
    parent_id: null,
    name: "Harbour Commercial Offices",
    kind: "site",
    building_type: null,
    use_case: "commercial",
    description: null,
    address: "24 Marina Road, Lagos",
    is_active: true,
    updated_at: "2026-11-07T18:10:00Z",
  },
  {
    id: "place-gatehouse",
    parent_id: null,
    name: "Marina Gatehouse",
    kind: "site",
    building_type: null,
    use_case: null,
    description: null,
    address: "Main gate, Marina Road",
    is_active: true,
    updated_at: "2026-11-06T12:10:00Z",
  },
  {
    id: "place-archive",
    parent_id: null,
    name: "Old Harbour Annexe",
    kind: "site",
    building_type: null,
    use_case: null,
    description: null,
    address: "2 Dock Lane, Lagos",
    is_active: false,
    updated_at: "2026-10-01T10:10:00Z",
  },
];

let placesMode = "success";
let placesDelay = 0;
let profilePermissions = ["*"];

function body(data) {
  return JSON.stringify({ success: true, data });
}

function errorBody(message) {
  return JSON.stringify({ success: false, message, errors: {} });
}

async function fulfillJson(route, value, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: value,
  });
}

async function createPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  await context.addCookies([
    { name: "auth-token", value: "oh03-audit-token", url: origin },
    {
      name: "selected-organization",
      value: organization.slug,
      url: origin,
    },
  ]);
  await context.addInitScript(
    ({ user, organization }) => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user,
            token: "oh03-audit-token",
            isAuthenticated: true,
            _hasHydrated: true,
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        "app-storage",
        JSON.stringify({
          state: {
            selectedProperty: null,
            organization,
            selectedResidency: null,
            branding: null,
          },
          version: 0,
        }),
      );
    },
    { user, organization },
  );

  const pageErrors = [];
  const consoleErrors = [];
  const page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await context.route("https://vmscore.to/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/\/$/, "");

    if (pathname === "/user/me") {
      return fulfillJson(route, body({ user }));
    }
    if (pathname === "/organizations/me") {
      return fulfillJson(route, body([organization]));
    }
    if (pathname === `/organizations/${organization.slug}`) {
      return fulfillJson(route, body(organization));
    }
    if (pathname === "/admin/me") {
      return fulfillJson(
        route,
        body({ ...admin, effective_permissions: profilePermissions }),
      );
    }
    if (pathname === "/workspace/context") {
      return fulfillJson(
        route,
        body({
          contract_version: "vmscore.context/v1",
          organization_id: organization.id,
          organization_use_case: "mixed_use",
          effective_use_case: "mixed_use",
          place_id: null,
          context_scope: "administration",
          modules: ["properties", "people", "access", "finance"],
          module_groups: [],
          management: {
            mode: "local",
            management_required: true,
            is_administrator: true,
            authoritative_place: null,
            administrators: [],
          },
        }),
      );
    }
    if (pathname === "/catalog/use-cases") {
      return fulfillJson(
        route,
        body({
          contract_version: "vmscore.context/v1",
          module_groups: [],
          specialist_groups: [],
          use_cases: [
            {
              value: "residential",
              label: "Residential",
              modules: [],
              module_groups: [],
            },
            {
              value: "commercial",
              label: "Commercial",
              modules: [],
              module_groups: [],
            },
            {
              value: "mixed_use",
              label: "Mixed use",
              modules: [],
              module_groups: [],
            },
            {
              value: "hospitality",
              label: "Hospitality",
              modules: [],
              module_groups: [],
            },
          ],
          building_types: [
            { value: "house", label: "House", kinds: ["building"] },
            { value: "office", label: "Office", kinds: ["building"] },
            { value: "apartment", label: "Apartment", kinds: ["unit"] },
          ],
          common_modules: [],
          structure_kinds: [],
        }),
      );
    }
    if (pathname === "/admin/places") {
      if (placesDelay) {
        await new Promise((resolve) => setTimeout(resolve, placesDelay));
      }
      if (placesMode === "error" || placesMode === "stale") {
        return fulfillJson(route, errorBody("Property service unavailable"), 503);
      }
      const search = (url.searchParams.get("search") || "").toLowerCase();
      const status = url.searchParams.get("is_active");
      let items = places;
      if (search) {
        items = items.filter((place) =>
          `${place.name} ${place.address}`.toLowerCase().includes(search),
        );
      }
      if (status === "true") items = items.filter((place) => place.is_active);
      if (status === "false") items = items.filter((place) => !place.is_active);
      if (placesMode === "empty") items = [];
      const pageNumber = Number(url.searchParams.get("page") || "1");
      return fulfillJson(
        route,
        body({
          items,
          page: pageNumber,
          page_size: 10,
          total: items.length,
          total_pages: items.length ? 1 : 0,
          has_next: false,
          has_previous: false,
        }),
      );
    }
    if (pathname === "/admin/organization") {
      return fulfillJson(route, body(organization));
    }
    if (pathname === "/admin/branding/theme/active") {
      return fulfillJson(route, body(null));
    }
    return fulfillJson(route, body([]));
  });

  return { context, page, pageErrors, consoleErrors };
}

async function waitForRegister(page) {
  await page.goto(`${origin}/admin/properties`, {
    waitUntil: "domcontentloaded",
  });
  try {
    await page
      .getByRole("heading", { name: "Properties", exact: true })
      .waitFor({ timeout: 15000 });
  } catch (error) {
    await page.screenshot({
      path: path.join(evidenceDir, "debug-register-timeout.png"),
      fullPage: true,
    });
    console.error({
      url: page.url(),
      text: (await page.locator("body").innerText()).slice(0, 2000),
    });
    throw error;
  }
  await page.getByRole("button", { name: "Open Harbour Court" }).waitFor();
}

async function capture(page, name, fullPage = true) {
  const target = path.join(evidenceDir, name);
  await page.screenshot({ path: target, fullPage });
  return target;
}

async function checkNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    elements: [
      ".property-workspace",
      ".property-registry",
      ".property-table-region",
      ".property-table",
      ".property-table tbody tr",
    ].map((selector) => {
      const element = document.querySelector(selector);
      const rect = element?.getBoundingClientRect();
      return {
        selector,
        left: rect?.left,
        right: rect?.right,
        width: rect?.width,
      };
    }),
    firstRow: (() => {
      const row = document.querySelector(".property-table tbody tr");
      if (!row) return null;
      const styles = window.getComputedStyle(row);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        cells: Array.from(row.querySelectorAll("td")).map((cell) => {
          const rect = cell.getBoundingClientRect();
          const cellStyles = window.getComputedStyle(cell);
          return {
            label: cell.getAttribute("data-label"),
            left: rect.left,
            top: rect.top,
            width: rect.width,
            display: cellStyles.display,
            gridColumn: cellStyles.gridColumn,
            gridRow: cellStyles.gridRow,
          };
        }),
      };
    })(),
  }));
  if (dimensions.document > dimensions.viewport + 1) {
    throw new Error(
      `${label} has horizontal overflow: ${JSON.stringify(dimensions)}`,
    );
  }
  return dimensions;
}

async function main() {
  await fs.mkdir(evidenceDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const viewports = [
    ["1440", { width: 1440, height: 1000 }],
    ["1024", { width: 1024, height: 900 }],
    ["768", { width: 768, height: 1000 }],
    ["390", { width: 390, height: 844 }],
    ["320", { width: 320, height: 760 }],
  ];

  try {
    for (const [label, viewport] of viewports) {
      placesMode = "success";
      placesDelay = 0;
      profilePermissions = ["*"];
      const { context, page, pageErrors, consoleErrors } = await createPage(
        browser,
        viewport,
      );
      await waitForRegister(page);
      const dimensions = await checkNoOverflow(page, `${label}px success`);
      const screenshot = await capture(
        page,
        `properties-${label}.png`,
      );
      if (viewport.width <= 390) {
        await page
          .locator(".property-table tbody tr")
          .first()
          .scrollIntoViewIfNeeded();
        await capture(page, `properties-${label}-card.png`, false);
      }
      results.push({
        state: "success",
        viewport: label,
        screenshot: path.basename(screenshot),
        dimensions,
        pageErrors,
        consoleErrors,
      });
      await context.close();
    }

    placesMode = "success";
    placesDelay = 3200;
    {
      const { context, page } = await createPage(browser, {
        width: 1440,
        height: 1000,
      });
      await page.goto(`${origin}/admin/properties`, {
        waitUntil: "domcontentloaded",
      });
      await page.getByRole("heading", { name: "Properties", exact: true }).waitFor();
      await page.getByText("Loading properties…").waitFor();
      await capture(page, "properties-loading-1440.png");
      await page.getByRole("button", { name: "Open Harbour Court" }).waitFor();
      await context.close();
    }

    placesDelay = 0;
    placesMode = "empty";
    {
      const { context, page } = await createPage(browser, {
        width: 390,
        height: 844,
      });
      await page.goto(`${origin}/admin/properties`, {
        waitUntil: "domcontentloaded",
      });
      await page.getByText("No properties found").waitFor();
      await capture(page, "properties-empty-390.png");
      await context.close();
    }

    placesMode = "error";
    {
      const { context, page } = await createPage(browser, {
        width: 1440,
        height: 1000,
      });
      await page.goto(`${origin}/admin/properties`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .getByText("Property service unavailable", { exact: true })
        .waitFor({ timeout: 15000 });
      await capture(page, "properties-error-1440.png");
      placesMode = "success";
      await page
        .getByRole("button", { name: "Retry", exact: true })
        .last()
        .click();
      await page.getByRole("button", { name: "Open Harbour Court" }).waitFor();
      await capture(page, "properties-retry-success-1440.png");
      await context.close();
    }

    placesMode = "success";
    {
      const { context, page } = await createPage(browser, {
        width: 390,
        height: 844,
      });
      await waitForRegister(page);
      placesMode = "stale";
      await page.getByRole("combobox", { name: "Status" }).selectOption(
        "archived",
      );
      await page.getByText(/latest update failed/i).waitFor();
      await checkNoOverflow(page, "390px stale");
      await capture(page, "properties-stale-390.png");
      await context.close();
    }

    placesMode = "success";
    profilePermissions = ["places.list", "places.show"];
    for (const [label, viewport] of [
      ["1440", { width: 1440, height: 1000 }],
      ["390", { width: 390, height: 844 }],
    ]) {
      const { context, page } = await createPage(browser, viewport);
      await waitForRegister(page);
      if (
        (await page.getByRole("button", { name: "New property" }).count()) !== 0
      ) {
        throw new Error(
          `${label}px read-only state exposed the create action`,
        );
      }
      await capture(page, `properties-read-only-${label}.png`);
      await context.close();
    }

    await fs.writeFile(
      path.join(evidenceDir, "capture-results.json"),
      `${JSON.stringify(results, null, 2)}\n`,
    );
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
