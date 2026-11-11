import type { CurrentUserContext, Organization } from "@/types";
import { domainExperience } from "@/config/domains";
import {
  buildPropertyWorkspaces,
  qualifiedPlaceName,
  type PropertyWorkspace,
} from "./catalog";

export type LobbyWorkspaceType = "organization" | "site_admin" | "party";

export interface LobbyWorkspaceSelection {
  id: string;
  name: string;
}

export interface LobbyWorkspace {
  id: string;
  type: LobbyWorkspaceType;
  category: string;
  title: string;
  description: string;
  roleLabel: string;
  destination: string;
  useCase?: string | null;
  /** Set when the destination needs tenant context before navigation. */
  selection?: LobbyWorkspaceSelection;
}

export type LobbyResolution =
  | { kind: "empty" }
  | { kind: "redirect"; workspace: LobbyWorkspace }
  | { kind: "picker" };

const PARTY_CATEGORY: Record<string, string> = {
  occupancy: "MY PLACE",
  staff: "STAFF ACCESS",
  guest: "GUEST STAY",
};

const PARTY_DESCRIPTION: Record<string, string> = {
  occupancy: "Visitors, invitations, payments and requests.",
  staff: "Assigned operational tools for your role.",
  guest: "Stay, arrival and guest access details.",
};

function managementDestination(useCase: string | null | undefined): string {
  const experience = domainExperience(useCase);
  return experience?.navigation[0]?.items[0]?.href ?? "/admin";
}

function organizationCard(
  context: CurrentUserContext,
  organization: Organization | null | undefined,
): LobbyWorkspace {
  return {
    id: `organization:${organization?.id ?? context.admin?.id ?? "current"}`,
    type: "organization",
    category: "ORGANIZATION",
    title: "Organization administration",
    description: "Manage members, organization settings and integrations.",
    roleLabel: context.admin?.role?.name || "Organization administrator",
    destination: "/organization",
  };
}

function siteCard(
  siteWorkspace: NonNullable<CurrentUserContext["site_workspaces"]>[number],
  organization: Organization | null | undefined,
): LobbyWorkspace {
  const useCase = siteWorkspace.site.use_case ?? organization?.use_case ?? null;
  return {
    id: `site_admin:${siteWorkspace.assignment_id}`,
    type: "site_admin",
    category: "SITE MANAGEMENT",
    title: siteWorkspace.site.name,
    description: "Manage occupancy, access, maintenance and charges.",
    roleLabel: "Site administrator",
    destination: managementDestination(useCase),
    useCase,
    selection: { id: siteWorkspace.site.id, name: siteWorkspace.site.name },
  };
}

function partyCard(workspace: PropertyWorkspace): LobbyWorkspace | null {
  const accesses = workspace.accesses.filter(
    (access) => access.area !== "management",
  );
  if (accesses.length === 0) return null;

  const areas = new Set(accesses.map((access) => access.area));
  const primaryArea =
    (["occupancy", "staff", "guest"] as const).find((area) =>
      areas.has(area),
    ) ?? "occupancy";
  const roleLabels = Array.from(
    new Set(accesses.map((access) => access.roleLabel)),
  );
  const selectionName = qualifiedPlaceName(
    workspace.place,
    workspace.placePath,
  );

  return {
    id: `party:${workspace.place.id}`,
    type: "party",
    category: PARTY_CATEGORY[primaryArea],
    title: selectionName,
    description: PARTY_DESCRIPTION[primaryArea],
    roleLabel: roleLabels.join(" · "),
    destination: `/workspace/${workspace.place.id}`,
    useCase: workspace.place.use_case ?? null,
    selection: { id: workspace.place.id, name: selectionName },
  };
}

/**
 * Build the authorized destinations the current user may enter. Organization
 * administration is controlled by the organization admin record; site
 * management and party membership stay independent so a site administrator is
 * never silently treated as a resident.
 */
export function buildLobbyWorkspaces({
  context,
  organization,
}: {
  context: CurrentUserContext;
  organization?: Organization | null;
}): LobbyWorkspace[] {
  const workspaces: LobbyWorkspace[] = [];

  if (context.admin) {
    workspaces.push(organizationCard(context, organization));
  }

  for (const siteWorkspace of context.site_workspaces ?? []) {
    workspaces.push(siteCard(siteWorkspace, organization));
  }

  const partyWorkspaces = buildPropertyWorkspaces({
    relationships: context.workspaces ?? [],
  });
  for (const workspace of partyWorkspaces) {
    const card = partyCard(workspace);
    if (card) workspaces.push(card);
  }

  return workspaces;
}

export function resolveLobbyWorkspaces(
  workspaces: LobbyWorkspace[],
): LobbyResolution {
  if (workspaces.length === 0) return { kind: "empty" };
  if (workspaces.length === 1) {
    return { kind: "redirect", workspace: workspaces[0] };
  }
  return { kind: "picker" };
}
