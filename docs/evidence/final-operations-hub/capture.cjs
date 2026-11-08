const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const evidenceDir = __dirname;
const baseOrigin = "http://lvh.me:3106";
const tenantOrigin = "http://final-audit.lvh.me:3106";
const organization = {
  id: "org-final",
  name: "Harbour Operations",
  slug: "final-audit",
  use_case: "mixed_use",
  description: "Integrated Operations Hub acceptance fixture",
  needs_first_site: false,
  subscription: { status: "active" },
};
const user = {
  id: "user-final",
  email: "final.audit@example.com",
  first_name: "Ada",
  last_name: "Okafor",
  is_verified: true,
};
const adminRole = {
  id: "role-super-admin",
  name: "Super Admin",
  code: "super_admin",
  description: "Full organization administration",
  permissions: ["*"],
  permissions_parsed: ["*"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};
const admin = {
  id: "admin-final",
  user,
  name: "Ada Okafor",
  role_id: adminRole.id,
  role: adminRole,
  roles: [adminRole],
  role_ids: [adminRole.id],
  permissions: null,
  effective_permissions: ["*"],
  created_at: "2026-11-08T00:00:00Z",
  updated_at: "2026-11-08T00:00:00Z",
};
const place = {
  id: "place-harbour",
  parent_id: null,
  name: "Harbour Court",
  slug: "harbour-court",
  kind: "site",
  building_type: null,
  use_case: "mixed_use",
  description: "Waterfront mixed-use property",
  address: "19 Marina Road, Lagos",
  is_active: true,
  updated_at: "2026-11-08T04:20:00Z",
  ancestors: [],
  children: [],
};
const relationship = {
  id: "relationship-final",
  organization_id: organization.id,
  role: "resident_of",
  status: "active",
  effective_from: null,
  effective_to: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  party: {
    id: "party-final",
    kind: "person",
    display_name: "Ada Okafor",
    email: user.email,
    is_active: true,
  },
  place,
};
const invitation = {
  id: "invitation-final",
  host_party_id: relationship.party.id,
  destination_place_id: place.id,
  code: "VIS-2048",
  qr_code_url: null,
  status: "requested",
  purpose: "Family visit",
  valid_from: "2026-11-08T08:00:00Z",
  valid_to: "2026-11-08T18:00:00Z",
  uses_count: 0,
  max_uses: 1,
  additional_information: null,
  decline_reason: null,
  requested_at: "2026-11-08T06:00:00Z",
  decided_at: null,
  host_party: {
    display_name: relationship.party.display_name,
  },
  destination_place: {
    id: place.id,
    name: place.name,
    kind: place.kind,
    address: place.address,
  },
  guests: [
    {
      id: "guest-final-1",
      display_name_snapshot: "Maya Okafor",
      email_snapshot: "maya@example.com",
      phone_snapshot: null,
      suffix: "A",
    },
    {
      id: "guest-final-2",
      display_name_snapshot: "Tunde Okafor",
      email_snapshot: null,
      phone_snapshot: "+2348000000000",
      suffix: "B",
    },
  ],
};
const gate = {
  id: "gate-final",
  name: "Main Gate",
  slug: "main-gate",
  is_default: true,
  admin_ids: [admin.id],
  dependency_id: null,
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-08T07:00:00Z",
  gate_admins: [],
  dependencies: [],
};
const charge = {
  id: "charge-final",
  name: "Monthly service charge",
  description: "Property services",
  amount: "25000.00",
  currency: "NGN",
  recurrence: "monthly",
  is_active: true,
};
const transaction = {
  id: "payment-final",
  reference: "PAY-2048",
  amount: "25000.00",
  currency: "NGN",
  status: "successful",
  payment_gateway: "paystack",
  created_at: "2026-11-08T07:30:00Z",
  party: relationship.party,
  charge_definition: charge,
};
const dashboard = {
  metrics: {
    total_places: 4,
    total_parties: 28,
    active_relationships: 20,
    active_visit_authorizations: 8,
    pending_visit_authorizations: 3,
    active_visit_sessions: 5,
    active_checkpoint_presences: 5,
    checkpoint_events_today: 17,
  },
  root_places: [place],
  recent_visit_authorizations: [invitation],
  recent_checkpoint_events: [
    {
      id: "event-final",
      direction: "entry",
      outcome: "allowed",
      reason_code: "valid_invitation",
      occurred_at: "2026-11-08T07:20:00Z",
      place_id: place.id,
      gate_id: gate.id,
    },
  ],
};

function body(data) {
  return JSON.stringify({ success: true, data });
}

async function json(route, value, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: value,
  });
}

function paginated(items, page = 1) {
  return {
    items,
    page,
    page_size: 25,
    total: items.length,
    total_pages: items.length ? 1 : 0,
    has_next: false,
    has_previous: false,
  };
}

async function createContext(
  browser,
  viewport,
  { authenticated = true, fixtureOrganization = organization } = {},
) {
  const context = await browser.newContext({ viewport });
  if (authenticated) {
    await context.addCookies([
      { name: "auth-token", value: "final-audit-token", url: baseOrigin },
      { name: "auth-token", value: "final-audit-token", url: tenantOrigin },
      {
        name: "selected-organization",
        value: fixtureOrganization.slug,
        url: tenantOrigin,
      },
    ]);
    await context.addInitScript(
      ({ organization, user }) => {
        localStorage.setItem(
          "auth-storage",
          JSON.stringify({
            state: {
              user,
              token: "final-audit-token",
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
      { organization: fixtureOrganization, user },
    );
  }

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
    const method = request.method();

    if (method !== "GET") return json(route, body({ ok: true }));
    if (pathname === "/user/me") return json(route, body({ user }));
    if (pathname === "/admin/me") return json(route, body(admin));
    if (pathname === "/admin/admins/list") {
      return json(route, body(paginated([admin])));
    }
    if (pathname === "/admin/role/list") {
      return json(route, body(paginated([adminRole])));
    }
    if (pathname === "/auth/verify") {
      return json(
        route,
        body({
          authenticated: true,
          user,
          party: relationship.party,
          organizations: [fixtureOrganization],
          workspaces: [relationship],
        }),
      );
    }
    if (pathname === "/organizations/me") {
      return json(route, body([fixtureOrganization]));
    }
    if (pathname === `/organizations/${fixtureOrganization.slug}`) {
      return json(route, body(fixtureOrganization));
    }
    if (pathname === "/admin/organization") {
      return json(route, body(fixtureOrganization));
    }
    if (pathname === "/catalog/use-cases") {
      return json(
        route,
        body({
          contract_version: "vmscore.context/v1",
          module_groups: [
            {
              label: "Operations",
              modules: [
                "dashboard",
                "properties",
                "people",
                "check_in_out",
                "charges",
                "forums",
                "gates",
                "plugins",
              ],
            },
          ],
          specialist_groups: [],
          use_cases: [
            { value: "mixed_use", label: "Mixed use", modules: [], module_groups: [] },
          ],
          building_types: [],
          common_modules: [
            "dashboard",
            "properties",
            "people",
            "check_in_out",
            "charges",
          ],
          structure_kinds: [],
        }),
      );
    }
    if (pathname === "/workspace/context") {
      return json(
        route,
        body({
          contract_version: "vmscore.context/v1",
          organization_id: fixtureOrganization.id,
          organization_use_case: "mixed_use",
          effective_use_case: "mixed_use",
          place_id: place.id,
          context_scope: "place",
          modules: [
            "dashboard",
            "properties",
            "people",
            "check_in_out",
            "charges",
            "forums",
            "gates",
            "plugins",
            "integrations",
          ],
          module_groups: [
            {
              label: "Operations",
              modules: ["dashboard", "properties", "people", "forums"],
            },
            {
              label: "Access",
              modules: ["check_in_out", "gates"],
            },
            {
              label: "Finance",
              modules: ["charges"],
            },
          ],
          management: {
            mode: "local",
            management_required: true,
            is_administrator: true,
            authoritative_place: place,
            administrators: [],
          },
        }),
      );
    }
    if (pathname === "/admin/dashboard") {
      return json(route, body(dashboard));
    }
    if (pathname === "/admin/analytics/summary") {
      return json(
        route,
        body({
          metrics: dashboard.metrics,
          trends: [],
          generated_at: "2026-11-08T08:00:00Z",
        }),
      );
    }
    if (pathname === "/admin/places") {
      return json(route, body(paginated([place])));
    }
    if (pathname === `/admin/places/${place.id}`) {
      return json(route, body(place));
    }
    if (pathname === `/admin/places/${place.id}/people`) {
      return json(
        route,
        body({
          place,
          effective_use_case: "mixed_use",
          administrators: [
            {
              assignment_id: "admin-final",
              party: relationship.party,
              role: "super_admin",
              is_super_admin: true,
              status: "active",
              source: "administration",
            },
          ],
          occupants: [
            {
              assignment_id: relationship.id,
              party: relationship.party,
              role: "resident",
              is_super_admin: false,
              status: "active",
              source: "occupancy",
            },
          ],
        }),
      );
    }
    if (pathname === "/admin/visit-authorizations") {
      return json(route, body(paginated([invitation])));
    }
    if (pathname === `/admin/visit-authorizations/${invitation.id}`) {
      return json(route, body(invitation));
    }
    if (pathname.endsWith("/sessions") || pathname.endsWith("/checkpoint-events")) {
      return json(route, body(paginated([])));
    }
    if (pathname === "/admin/gates") {
      return json(route, body(paginated([gate])));
    }
    if (pathname === `/admin/gate/${gate.id}`) return json(route, body(gate));
    if (pathname === "/admin/charges/definitions") {
      return json(route, body(paginated([charge])));
    }
    if (pathname === `/admin/charges/definitions/${charge.id}`) {
      return json(route, body(charge));
    }
    if (pathname === "/admin/charges/assignments") {
      return json(route, body(paginated([])));
    }
    if (pathname === "/admin/transactions") {
      return json(route, body(paginated([transaction])));
    }
    if (pathname === `/admin/transactions/${transaction.id}`) {
      return json(route, body(transaction));
    }
    if (pathname === "/admin/forum/category/list") {
      return json(
        route,
        body([
          {
            id: "category-final",
            name: "Property notices",
            description: "Operational updates for Harbour Court",
            topic_count: 3,
            post_count: 12,
          },
        ]),
      );
    }
    if (pathname === "/admin/forum/topics") {
      return json(route, body(paginated([])));
    }
    if (pathname === "/admin/plugins") return json(route, body([]));
    if (pathname === "/admin/plugins/entitlements") return json(route, body([]));
    if (pathname === "/admin/config/payment/list") return json(route, body([]));
    if (pathname === "/admin/integrations") return json(route, body(paginated([])));
    if (pathname === "/admin/config/mailer/settings") {
      return json(
        route,
        body({
          provider: "smtp",
          from_email: "operations@example.com",
          from_name: "Harbour Operations",
          configured: true,
        }),
      );
    }
    if (pathname === "/organizations/subscription/current") {
      return json(
        route,
        body({
          status: "active",
          plan: { id: "pro", name: "Pro", amount: "15000", currency: "NGN" },
        }),
      );
    }
    if (pathname === "/admin/subscription/invoices") {
      return json(route, body(paginated([])));
    }
    if (pathname === "/admin/branding/theme/active") return json(route, body(null));
    if (pathname === "/admin/branding/themes") return json(route, body([]));
    if (pathname === "/user/notifications") {
      return json(route, body(paginated([])));
    }
    return json(route, body([]));
  });

  return { context, page, pageErrors, consoleErrors };
}

async function captureRoute(session, spec, viewport, label) {
  const { page, pageErrors: allPageErrors, consoleErrors: allConsoleErrors } =
    session;
  const pageErrorStart = allPageErrors.length;
  const consoleErrorStart = allConsoleErrors.length;
  let response = null;
  try {
    response = await page.goto(`${spec.origin || tenantOrigin}${spec.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page
      .waitForFunction(
        () =>
          !document.body.innerText.includes("VERIFYING SESSION") &&
          !document.body.innerText.includes("Verifying session") &&
          !document.querySelector('[aria-label="Loading organization"]') &&
          !document.querySelector('[aria-label="Loading collection"]') &&
          !document.body.innerText.includes("Loading charge permissions") &&
          !!document.querySelector("h1")?.textContent?.trim(),
        undefined,
        { timeout: 15000 },
      )
      .catch((error) => {
        allPageErrors.push(`session readiness: ${error.message}`);
      });
    if (spec.expectedPath) {
      await page.waitForURL(
        (url) => {
          const expected = new URL(spec.expectedPath, url.origin);
          return (
            url.pathname.replace(/\/$/, "") ===
              expected.pathname.replace(/\/$/, "") &&
            url.search === expected.search
          );
        },
        { timeout: 10000 },
      );
    }
    await page.waitForTimeout(250);
    await page
      .locator("main, [role='main'], body")
      .first()
      .waitFor({ timeout: 5000 });
  } catch (error) {
    allPageErrors.push(error.message);
  }
  const dimensions = await page
    .evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }))
    .catch((error) => {
      allPageErrors.push(`dimensions: ${error.message}`);
      return { viewport, document: viewport.width, body: viewport.width };
    });
  const fileName = `${spec.name}-${label}.png`;
  await page
    .screenshot({
      path: path.join(evidenceDir, fileName),
      fullPage: true,
      timeout: 15000,
    })
    .catch((error) => allPageErrors.push(`screenshot: ${error.message}`));
  return {
    route: spec.path,
    name: spec.name,
    viewport: label,
    status: response?.status() ?? null,
    url: page.url(),
    title: await page.title().catch(() => null),
    heading: await page
      .locator("h1")
      .first()
      .textContent()
      .catch(() => null),
    overflow: dimensions.document > dimensions.viewport + 1,
    dimensions,
    pageErrors: allPageErrors.slice(pageErrorStart),
    consoleErrors: allConsoleErrors.slice(consoleErrorStart),
    expectedPath: spec.expectedPath || null,
    reachedExpectedPath: spec.expectedPath
      ? (() => {
          let actual;
          try {
            actual = new URL(page.url());
          } catch {
            actual = new URL(spec.expectedPath, tenantOrigin);
          }
          const expected = new URL(
            spec.expectedPath,
            spec.origin || tenantOrigin,
          );
          return (
            actual.pathname.replace(/\/$/, "") ===
              expected.pathname.replace(/\/$/, "") &&
            actual.search === expected.search
          );
        })()
      : null,
    screenshot: fileName,
  };
}

async function main() {
  await fs.mkdir(evidenceDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const routeSpecs = [
    { name: "organizations", path: "/organizations", origin: baseOrigin },
    { name: "organization-home", path: "/organization" },
    { name: "organization-workspaces", path: "/organization/workspaces" },
    {
      name: "select-compatibility",
      path: "/select",
      expectedPath: "/organization/workspaces",
    },
    { name: "dashboard", path: "/admin" },
    { name: "properties", path: "/admin/properties" },
    { name: "people", path: "/admin/people" },
    { name: "invitations", path: "/admin/invitations" },
    { name: "charges", path: "/admin/charges" },
    { name: "gates", path: "/admin/gates" },
    { name: "checkpoints", path: "/admin/checkpoints" },
    { name: "settings", path: "/organization/settings" },
    {
      name: "settings-administrators",
      path: "/organization/settings/administrators",
    },
    { name: "settings-roles", path: "/organization/settings/roles" },
    { name: "plugins", path: "/admin/plugins" },
    { name: "integrations", path: "/admin/integrations" },
    { name: "community", path: "/admin/forums" },
    { name: "transactions", path: "/admin/transactions" },
    { name: "profile", path: "/admin/profile" },
    {
      name: "plans",
      path: "/plans",
      expectedPath: "/plans",
    },
    {
      name: "design-system",
      path: "/design-system",
      origin: baseOrigin,
    },
    {
      name: "login",
      path: "/auth/login",
      origin: baseOrigin,
      authenticated: false,
    },
  ];
  const requestedRoutes = process.env.CAPTURE_ROUTES
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const selectedRouteSpecs =
    requestedRoutes && requestedRoutes[0] !== "none"
      ? routeSpecs.filter((spec) => requestedRoutes.includes(spec.name))
      : requestedRoutes
        ? []
        : routeSpecs;
  const viewports = [
    ["1440", { width: 1440, height: 1000 }],
    ["768", { width: 768, height: 1000 }],
    ["390", { width: 390, height: 844 }],
    ["320", { width: 320, height: 760 }],
  ];
  const requestedViewports = process.env.CAPTURE_VIEWPORTS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const selectedViewports = requestedViewports
    ? viewports.filter(([label]) => requestedViewports.includes(label))
    : viewports;
  const captureFirstPlace = process.env.CAPTURE_FIRST_PLACE !== "false";
  const resultsName =
    process.env.CAPTURE_RESULTS || "results.json";
  const results = [];
  try {
    for (const [label, viewport] of selectedViewports) {
      const session = await createContext(browser, viewport);
      for (const spec of selectedRouteSpecs) {
        if (spec.authenticated === false) {
          const anonymousSession = await createContext(browser, viewport, {
            authenticated: false,
          });
          results.push(
            await captureRoute(anonymousSession, spec, viewport, label),
          );
          await anonymousSession.context.close().catch(() => {});
        } else {
          results.push(await captureRoute(session, spec, viewport, label));
        }
      }
      await session.context.close().catch(() => {});

      if (captureFirstPlace) {
        const firstPlaceSession = await createContext(browser, viewport, {
          fixtureOrganization: { ...organization, needs_first_site: true },
        });
        results.push(
          await captureRoute(
            firstPlaceSession,
            {
              name: "first-place-gate",
              path: "/admin",
              expectedPath: "/setup/first-place",
            },
            viewport,
            label,
          ),
        );
        await firstPlaceSession.context.close().catch(() => {});
      }
    }
    await fs.writeFile(
      path.join(evidenceDir, resultsName),
      `${JSON.stringify(results, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          captures: results.length,
          results: path.join(evidenceDir, "results.json"),
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
