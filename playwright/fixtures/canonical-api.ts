import type { BrowserContext, Page, Route } from "@playwright/test";

import { vmsConfig } from "../configs/vms.config";

type Role = "admin" | "member" | "occupant" | "guest";
type Json = Record<string, unknown>;

export interface FixtureOptions {
  role?: Role;
  needsFirstSite?: boolean;
  slug?: string;
  emptyOrganizationIndex?: boolean;
  places?: Json[];
  invitations?: Json[];
  charges?: Json[];
  gates?: Json[];
  plugins?: Json[];
  integrations?: Json[];
}

const user = {
  id: "user-e2e",
  email: "ada.e2e@example.com",
  first_name: "Ada",
  last_name: "Okafor",
  is_verified: true,
};

const role = {
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
  id: "admin-e2e",
  user,
  name: "Ada Okafor",
  role_id: role.id,
  role,
  roles: [role],
  role_ids: [role.id],
  permissions: null,
  effective_permissions: ["*"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const party = {
  id: "party-e2e",
  kind: "person",
  display_name: "Ada Okafor",
  email: user.email,
  is_active: true,
};

const defaultPlace = {
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

const defaultInvitation = {
  id: "invitation-e2e",
  host_party_id: party.id,
  destination_place_id: defaultPlace.id,
  code: "VIS-2048",
  qr_code_url: null,
  status: "requested",
  valid_from: "2026-11-08T08:00:00Z",
  valid_to: "2026-11-08T18:00:00Z",
  uses_count: 0,
  max_uses: 1,
  purpose: "Family visit",
  additional_information: null,
  decline_reason: null,
  requested_at: "2026-11-08T06:00:00Z",
  decided_at: null,
  host_party: { display_name: party.display_name },
  destination_place: {
    id: defaultPlace.id,
    name: defaultPlace.name,
    kind: defaultPlace.kind,
    address: defaultPlace.address,
  },
  guests: [
    {
      id: "guest-e2e",
      display_name_snapshot: "Maya Okafor",
      email_snapshot: "maya@example.com",
      phone_snapshot: null,
      suffix: "A",
    },
  ],
};

const defaultCharge = {
  id: "charge-e2e",
  name: "Monthly service charge",
  description: "Property services",
  amount: "25000.00",
  currency: "NGN",
  recurrence: "monthly",
  is_active: true,
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-01T00:00:00Z",
};

const defaultGate = {
  id: "gate-e2e",
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

function body(data: unknown) {
  return JSON.stringify({ success: true, data });
}

function paginated(items: Json[], page = 1, pageSize = 25) {
  return {
    items,
    page,
    page_size: pageSize,
    total: items.length,
    total_pages: items.length ? Math.ceil(items.length / pageSize) : 0,
    has_next: false,
    has_previous: false,
  };
}

async function fulfill(route: Route, data: unknown, status = 200) {
  const origin = route.request().headers().origin;
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: {
      ...(origin ? { "access-control-allow-origin": origin } : {}),
      "access-control-allow-credentials": "true",
    },
    body: body(data),
  });
}

function searchItems(items: Json[], search: string | null) {
  if (!search) return items;
  const query = search.toLowerCase();
  return items.filter((item) =>
    Object.values(item).some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(query),
    ),
  );
}

export async function seedSession(
  context: BrowserContext,
  options: FixtureOptions = {},
) {
  const slug = options.slug || "harbour";
  const organization = makeOrganization({
    needsFirstSite: options.needsFirstSite ?? false,
    slug,
  });
  await context.addCookies([
    {
      name: "auth-token",
      value: "e2e-token",
      url: vmsConfig.webBaseURL,
      sameSite: "Lax",
    },
    {
      name: "auth-token",
      value: "e2e-token",
      url: vmsConfig.tenantURL(slug),
      sameSite: "Lax",
    },
    {
      name: "selected-organization",
      value: slug,
      url: vmsConfig.tenantURL(slug),
      sameSite: "Lax",
    },
  ]);
  await context.addInitScript(
    ({ organization, user, selectedProperty }) => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user,
            token: "e2e-token",
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
            selectedProperty,
            organization,
            selectedResidency: null,
            branding: null,
          },
          version: 0,
        }),
      );
    },
    { organization, user, selectedProperty: defaultPlace },
  );
  return vmsConfig.tenantURL(slug);
}

export function makeOrganization({
  needsFirstSite = false,
  slug = "harbour",
  name = "Harbour Operations",
}: {
  needsFirstSite?: boolean;
  slug?: string;
  name?: string;
} = {}) {
  return {
    id: `org-${slug}`,
    name,
    slug,
    use_case: "mixed_use",
    description: "Integrated E2E organization",
    needs_first_site: needsFirstSite,
    subscription: needsFirstSite ? null : { status: "active" },
  };
}

export async function installCanonicalApi(
  page: Page,
  options: FixtureOptions = {},
) {
  const state = {
    authenticated: false,
    hasOrganizations: !options.emptyOrganizationIndex,
    role: options.role || ("admin" as Role),
    organization: makeOrganization({
      needsFirstSite: options.needsFirstSite ?? false,
      slug: options.slug || "harbour",
    }),
    places: [
      ...(options.places ||
        (options.needsFirstSite ? [] : [defaultPlace])),
    ],
    people: [] as Json[],
    invitations: [...(options.invitations || [defaultInvitation])],
    charges: [...(options.charges || [defaultCharge])],
    gates: [...(options.gates || [defaultGate])],
    plugins: [...(options.plugins || [])],
    integrations: [...(options.integrations || [])],
    mutations: [] as string[],
  };

  await page.route(`${vmsConfig.apiOrigin}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method();
    const payload =
      method === "GET" || method === "HEAD"
        ? null
        : (request.postDataJSON() as Json | null);

    if (method === "POST" && path === "/auth/login") {
      state.authenticated = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "set-cookie": `auth-token=e2e-token; Domain=.${vmsConfig.baseDomain}; Path=/; SameSite=Lax`,
        },
        body: body({ user, token: "e2e-token" }),
      });
      return;
    }
    if (method === "POST" && path === "/auth/register") {
      state.authenticated = true;
      await fulfill(route, { user, token: "e2e-token" });
      return;
    }
    if (method === "POST" && path === "/auth/logout") {
      state.authenticated = false;
      await fulfill(route, null);
      return;
    }
    if (method === "GET" && path === "/user/me") {
      return fulfill(route, { user });
    }
    if (method === "GET" && path === "/auth/verify") {
      const roleForContext =
        state.role === "member"
          ? "member"
          : state.role === "occupant"
            ? "resident"
            : state.role === "guest"
              ? "guest"
              : "admin";
      return fulfill(route, {
        authenticated: true,
        user,
        party,
        organizations: [state.organization],
        workspaces: [
          {
            id: `workspace-${roleForContext}`,
            organization_id: state.organization.id,
            role: roleForContext,
            status: "active",
            effective_from: null,
            effective_to: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
            party,
            place: state.places[0],
          },
        ],
      });
    }
    if (method === "GET" && path === "/admin/me") {
      return fulfill(route, {
        ...admin,
        effective_permissions:
          state.role === "admin" ? ["*"] : ["profile.show"],
      });
    }
    if (method === "GET" && path === "/organizations/me") {
      return fulfill(route, state.hasOrganizations ? [state.organization] : []);
    }
    if (method === "GET" && path.startsWith("/organizations/check-slug/")) {
      return fulfill(route, { exists: false });
    }
    if (method === "POST" && path === "/organizations/create") {
      state.mutations.push("organization.create");
      state.hasOrganizations = true;
      state.organization = makeOrganization({
        needsFirstSite: true,
        slug: String(payload?.slug || "e2e-organization"),
        name: String(payload?.name || "E2E Organization"),
      });
      return fulfill(route, state.organization);
    }
    if (method === "GET" && path === "/subscription/plans") {
      return fulfill(route, [
        {
          id: "free-plan",
          name: "Free",
          description: "Start operating",
          price_monthly: 0,
          price_yearly: 0,
          trial_days: 0,
          is_active: true,
          sort_order: 1,
          features: { Properties: true, People: true },
        },
      ]);
    }
    if (method === "POST" && path === "/organizations/subscribe") {
      state.mutations.push("organization.subscribe");
      state.organization.subscription = { status: "active" };
      return fulfill(route, {
        id: "subscription-e2e",
        plan_id: String(payload?.plan_id || "free-plan"),
        status: "active",
      });
    }
    if (
      method === "GET" &&
      path === `/organizations/${state.organization.slug}`
    ) {
      return fulfill(route, state.organization);
    }
    if (method === "GET" && path === "/organizations/subscription/current") {
      return fulfill(route, state.organization.subscription);
    }
    if (method === "GET" && path === "/catalog/use-cases") {
      return fulfill(route, {
        contract_version: "vmscore.context/v1",
        use_cases: [
          {
            value: "mixed_use",
            label: "Mixed use",
            modules: [],
            module_groups: [],
          },
        ],
        building_types: [],
        structure_kinds: [],
        common_modules: ["dashboard", "properties", "people", "check_in_out"],
        module_groups: [],
        specialist_groups: [],
      });
    }
    if (method === "GET" && path === "/workspace/context") {
      const management = state.role === "admin";
      return fulfill(route, {
        contract_version: "vmscore.context/v1",
        organization_id: state.organization.id,
        organization_use_case: "mixed_use",
        effective_use_case: "mixed_use",
        place_id: state.places[0]?.id || null,
        context_scope: management ? "place" : "organization",
        modules: management
          ? [
              "dashboard",
              "properties",
              "people",
              "check_in_out",
              "charges",
              "forums",
              "gates",
              "plugins",
              "integrations",
            ]
          : [],
        module_groups: [],
        management: {
          mode: management ? "local" : "none",
          management_required: true,
          is_administrator: management,
          authoritative_place: management ? state.places[0] : null,
          administrators: [],
        },
      });
    }
    if (method === "GET" && path === "/admin/dashboard") {
      return fulfill(route, {
        metrics: {
          total_places: state.places.length,
          total_parties: 28,
          active_relationships: 20,
          active_visit_authorizations: 8,
          pending_visit_authorizations: state.invitations.filter(
            (item) => item.status === "requested",
          ).length,
          active_visit_sessions: 5,
          active_checkpoint_presences: 5,
          checkpoint_events_today: 17,
        },
        root_places: state.places.filter((place) => !place.parent_id),
        recent_visit_authorizations: state.invitations,
        recent_checkpoint_events: [],
      });
    }
    if (method === "GET" && path === "/admin/analytics/summary") {
      return fulfill(route, {
        metrics: {
          total_places: state.places.length,
          total_parties: 28,
          active_relationships: 20,
          active_visit_authorizations: 8,
          pending_visit_authorizations: 0,
          active_visit_sessions: 5,
          active_checkpoint_presences: 5,
          checkpoint_events_today: 17,
        },
        trends: [],
        generated_at: "2026-11-08T08:00:00Z",
      });
    }
    if (path === "/admin/places" && method === "GET") {
      const pageNumber = Number(url.searchParams.get("page") || 1);
      const pageSize = Number(url.searchParams.get("page_size") || 10);
      let matches = searchItems(
        state.places,
        url.searchParams.get("search"),
      );
      const kind = url.searchParams.get("kind");
      if (kind) matches = matches.filter((place) => place.kind === kind);
      const active = url.searchParams.get("is_active");
      if (active !== null) {
        matches = matches.filter(
          (place) => String(place.is_active) === active,
        );
      }
      if (url.searchParams.get("root_only") === "true") {
        matches = matches.filter((place) => !place.parent_id);
      }
      return fulfill(
        route,
        {
          ...paginated(matches, pageNumber, pageSize),
          items: matches.slice(
            (pageNumber - 1) * pageSize,
            pageNumber * pageSize,
          ),
        },
      );
    }
    if (path === "/admin/places" && method === "POST") {
      state.mutations.push("place.create");
      const created = {
        ...defaultPlace,
        id: `place-${state.places.length + 1}`,
        parent_id: payload?.parent_id || null,
        name: String(payload?.name || "New Place"),
        slug: String(payload?.name || "new-place")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
        kind: String(payload?.kind || "site"),
        address: String(payload?.address || ""),
        description: String(payload?.description || ""),
        ancestors: [],
        children: [],
      };
      state.places.push(created);
      if (state.organization.needs_first_site) {
        state.organization.needs_first_site = false;
      }
      return fulfill(route, created);
    }
    const placeMatch = path.match(/^\/admin\/places\/([^/]+)$/);
    if (placeMatch && method === "GET") {
      return fulfill(
        route,
        state.places.find((place) => place.id === placeMatch[1]) || null,
      );
    }
    if (placeMatch && method === "PATCH") {
      state.mutations.push("place.update");
      const found = state.places.find((place) => place.id === placeMatch[1]);
      if (found) Object.assign(found, payload);
      return fulfill(route, found);
    }
    const peopleMatch = path.match(/^\/admin\/places\/([^/]+)\/people$/);
    if (peopleMatch && method === "GET") {
      const place = state.places.find((item) => item.id === peopleMatch[1]);
      return fulfill(route, {
        place,
        effective_use_case: "mixed_use",
        administrators: [
          {
            assignment_id: "admin-e2e",
            party,
            role: "super_admin",
            is_super_admin: true,
            status: "active",
            source: "administration",
          },
        ],
        occupants: state.people,
      });
    }
    const addPersonMatch = path.match(
      /^\/admin\/places\/([^/]+)\/parties$/,
    );
    if (addPersonMatch && method === "POST") {
      state.mutations.push("place.person.add");
      const newPerson = {
        assignment_id: "person-e2e",
        party: {
          id: "person-e2e",
          kind: "person",
          display_name: String(payload?.display_name || "New Person"),
          email: String(payload?.email || ""),
          is_active: true,
        },
        role: String(payload?.role || "resident"),
        is_super_admin: false,
        status: "active",
        source: "occupancy",
      };
      state.people.push(newPerson);
      return fulfill(route, {
        assignment_id: "person-e2e",
        role: String(payload?.role || "resident"),
        is_super_admin: false,
        status: "active",
        party: {
          id: "person-e2e",
          kind: "person",
          display_name: String(payload?.display_name || "New Person"),
          email: String(payload?.email || ""),
          is_active: true,
          organization_id: state.organization.id,
          user_id: null,
        },
        place: state.places[0],
        onboarding_email: "queued",
        user_created: true,
      });
    }
    if (path.endsWith("/move") && method === "POST") {
      state.mutations.push("place.move");
      return fulfill(route, state.places[0]);
    }
    if (
      (path.endsWith("/archive") || path.endsWith("/activate")) &&
      method === "POST"
    ) {
      state.mutations.push(
        path.endsWith("/archive") ? "place.archive" : "place.activate",
      );
      return fulfill(route, state.places[0]);
    }
    if (method === "GET" && path === "/admin/visit-authorizations") {
      return fulfill(route, paginated(state.invitations));
    }
    const invitationMatch = path.match(
      /^\/admin\/visit-authorizations\/([^/]+)\/(approve|decline|revoke)$/,
    );
    if (invitationMatch && method === "POST") {
      state.mutations.push(`invitation.${invitationMatch[2]}`);
      const invitation = state.invitations.find(
        (item) => item.id === invitationMatch[1],
      );
      if (invitation) {
        invitation.status =
          invitationMatch[2] === "approve" ? "approved" : "declined";
      }
      return fulfill(route, invitation);
    }
    if (method === "GET" && path === "/admin/charges/definitions") {
      return fulfill(route, paginated(state.charges));
    }
    if (method === "POST" && path === "/admin/charges/definitions") {
      state.mutations.push("charge.definition.create");
      const charge = {
        ...defaultCharge,
        id: `charge-${state.charges.length + 1}`,
        ...payload,
      };
      state.charges.push(charge);
      return fulfill(route, charge);
    }
    if (method === "GET" && path === "/admin/charges/assignments") {
      return fulfill(route, paginated([]));
    }
    if (method === "POST" && path === "/admin/charges/assignments") {
      state.mutations.push("charge.assign");
      return fulfill(route, {
        id: "assignment-e2e",
        charge_definition_id: state.charges[0].id,
        charge_definition: state.charges[0],
        target_place: state.places[0],
        current_responsibility: null,
        outstanding_amount: "0.00",
      });
    }
    if (path.endsWith("/schedules") && method === "POST") {
      state.mutations.push("charge.schedules.generate");
      return fulfill(route, []);
    }
    if (method === "GET" && path === "/admin/gates") {
      return fulfill(route, paginated(state.gates));
    }
    if (method === "POST" && path === "/admin/gates") {
      state.mutations.push("gate.create");
      const gate = {
        ...defaultGate,
        id: `gate-${state.gates.length + 1}`,
        ...payload,
      };
      state.gates.push(gate);
      return fulfill(route, gate);
    }
    if (method === "GET" && path === "/admin/plugins") {
      return fulfill(route, state.plugins);
    }
    if (method === "GET" && path === "/admin/plugins/entitlements") {
      return fulfill(route, []);
    }
    if (method === "GET" && path === "/admin/integrations") {
      return fulfill(route, paginated(state.integrations));
    }
    if (method === "POST" && path === "/admin/integrations") {
      state.mutations.push("integration.create");
      const integration = { id: "integration-e2e", ...payload };
      state.integrations.push(integration);
      return fulfill(route, integration);
    }
    if (method === "GET" && path === "/admin/admins/list") {
      return fulfill(route, paginated([admin]));
    }
    if (method === "GET" && path === "/admin/role/list") {
      return fulfill(route, paginated([role]));
    }
    if (method === "GET" && path === "/admin/transactions") {
      return fulfill(route, paginated([]));
    }
    if (method === "GET" && path === "/admin/forum/category/list") {
      return fulfill(route, [
        {
          id: "category-e2e",
          name: "Property notices",
          description: "Operational updates",
          topic_count: 1,
          post_count: 2,
        },
      ]);
    }
    if (method === "GET" && path === "/admin/forum/topics") {
      return fulfill(route, paginated([]));
    }
    if (method === "GET" && path === "/user/notifications") {
      return fulfill(route, paginated([]));
    }
    if (method === "GET" && path === "/admin/branding/theme/active") {
      return fulfill(route, null);
    }
    if (method === "GET" && path === "/admin/branding/themes") {
      return fulfill(route, []);
    }
    if (method === "GET" && path === "/admin/subscription/invoices") {
      return fulfill(route, paginated([]));
    }
    if (method === "GET" && path === "/admin/config/payment/list") {
      return fulfill(route, []);
    }
    return fulfill(route, []);
  });

  return state;
}
