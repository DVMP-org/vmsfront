import { describe, expect, it } from "vitest";
import type { CurrentUserContext } from "@/types";
import {
  buildLobbyWorkspaces,
  resolveLobbyWorkspaces,
} from "./lobby";

function context(
  overrides: Partial<CurrentUserContext> = {},
): CurrentUserContext {
  return {
    user: { id: "user", email: "alex@example.com" } as never,
    party: null,
    admin: null,
    workspaces: [],
    site_workspaces: [],
    ...overrides,
  } as CurrentUserContext;
}

const siteWorkspace = {
  assignment_id: "assignment-1",
  role: "site_admin" as const,
  site: {
    id: "site-1",
    organization_id: "org-1",
    parent_site_id: null,
    name: "Pebble Court",
    slug: "pebble-court",
    use_case: "residential" as const,
    description: null,
    address: "1 Pebble Way",
    is_active: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  effective_permissions: ["places.list"],
};

const relationship = {
  id: "relationship-1",
  organization_id: "org-1",
  site_id: "site-1",
  role: "resident",
  status: "active",
  effective_from: null,
  effective_to: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  party: { id: "party-1", display_name: "Alex Morgan" },
  place: {
    id: "place-1",
    name: "APT 01",
    slug: "apt-01",
    kind: "unit",
    parent_id: "site-1",
    site_name: "Pebble Court",
    is_active: true,
    use_case: "residential",
  },
};

const organization = {
  id: "org-1",
  name: "Harbour Estate",
  slug: "harbour",
  use_case: "residential" as const,
  subscription: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const admin = {
  id: "admin-1",
  user_id: "user",
  role_id: "role-1",
  permissions: "*",
  role: { id: "role-1", name: "Super Admin" },
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

describe("buildLobbyWorkspaces", () => {
  it("does not offer organization administration without an organization admin record", () => {
    const workspaces = buildLobbyWorkspaces({
      context: context({ workspaces: [] as never }),
      organization,
    });

    expect(workspaces).toEqual([]);
  });

  it("offers organization administration only when the admin record exists", () => {
    const workspaces = buildLobbyWorkspaces({
      context: context({ admin: admin as never }),
      organization,
    });

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toMatchObject({
      type: "organization",
      title: "Organization administration",
      destination: "/organization",
      roleLabel: "Super Admin",
    });
  });

  it("keeps site administration and party membership as separate destinations", () => {
    const workspaces = buildLobbyWorkspaces({
      context: context({
        workspaces: [relationship] as never,
        site_workspaces: [siteWorkspace],
      }),
      organization,
    });

    const siteCard = workspaces.find((item) => item.type === "site_admin");
    const partyCard = workspaces.find((item) => item.type === "party");

    expect(siteCard).toMatchObject({
      title: "Pebble Court",
      destination: "/admin",
      roleLabel: "Site administrator",
      selection: { id: "site-1", name: "Pebble Court" },
    });
    expect(partyCard).toMatchObject({
      title: "Pebble Court - APT 01",
      category: "MY PLACE",
      roleLabel: "Resident",
      destination: "/workspace/place-1",
      selection: { id: "place-1", name: "Pebble Court - APT 01" },
    });
  });

  it("drops administrative place relationships from party cards", () => {
    const workspaces = buildLobbyWorkspaces({
      context: context({
        workspaces: [
          {
            ...relationship,
            role: "admin",
            is_super_admin: true,
          },
        ] as never,
      }),
      organization,
    });

    expect(workspaces).toEqual([]);
  });

  it("merges multiple memberships at one place into a single card", () => {
    const workspaces = buildLobbyWorkspaces({
      context: context({
        workspaces: [
          relationship,
          { ...relationship, id: "relationship-2", role: "owner" },
        ] as never,
      }),
      organization,
    });

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0].title).toBe("Pebble Court - APT 01");
    expect(workspaces[0].roleLabel).toContain("Resident");
    expect(workspaces[0].roleLabel).toContain("Owner");
  });
});

describe("resolveLobbyWorkspaces", () => {
  const card = {
    id: "organization:org-1",
    type: "organization" as const,
    category: "ORGANIZATION",
    title: "Organization administration",
    description: "",
    roleLabel: "Owner",
    destination: "/organization",
  };

  it("reports an empty lobby", () => {
    expect(resolveLobbyWorkspaces([])).toEqual({ kind: "empty" });
  });

  it("redirects straight to a single authorized destination", () => {
    expect(resolveLobbyWorkspaces([card])).toEqual({
      kind: "redirect",
      workspace: card,
    });
  });

  it("shows the picker when more than one destination is authorized", () => {
    expect(resolveLobbyWorkspaces([card, { ...card, id: "party:place" }])).toEqual(
      { kind: "picker" },
    );
  });
});


it("uses the Site operating type independently of legacy organization and Place classification", () => {
  const workspaces = buildLobbyWorkspaces({
    context: context({
      site_workspaces: [{ ...siteWorkspace, site: { ...siteWorkspace.site, use_case: "hospitality" } }],
      workspaces: [relationship] as never,
    }),
    organization,
  });
  expect(workspaces.find(item => item.type === "site_admin")).toMatchObject({
    useCase: "hospitality", destination: "/admin",
  });
  expect(workspaces.find(item => item.type === "party")).not.toHaveProperty("useCase");
});
