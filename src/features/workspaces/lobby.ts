import type { CurrentUserContext, Organization } from "@/types";
import { domainExperience, type DomainUseCase } from "@/config/domains";
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
  occupancy: "PERSONAL ACCESS",
  staff: "STAFF ACCESS",
  guest: "GUEST STAY",
};

const PERSONAL_SPACE_LABEL: Record<DomainUseCase, string> = {
  residential: "HOME",
  commercial: "SPACE",
  hospitality: "STAY",
  mixed_use: "SPACE",
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
    roleLabel: context.admin?.role?.name || "Organization administrator",
    destination: "/organization",
  };
}

function siteCard(
  siteWorkspace: NonNullable<CurrentUserContext["site_workspaces"]>[number],
): LobbyWorkspace {
  const useCase = siteWorkspace.site.use_case;
  const experience = domainExperience(useCase);
  return {
    id: `site_admin:${siteWorkspace.assignment_id}:${siteWorkspace.site.id}`,
    type: "site_admin",
    category: experience
      ? `${experience.label.toUpperCase()} PROPERTY`
      : "PROPERTY",
    title: siteWorkspace.site.name,
    roleLabel: "Site administrator",
    destination: `${managementDestination(useCase)}${
      managementDestination(useCase).includes("?") ? "&" : "?"
    }site_id=${siteWorkspace.site.id}`,
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
  const useCase = workspace.place.effective_use_case;
  const experience = domainExperience(useCase);
  const areaLabel =
    primaryArea === "staff"
      ? "TEAM"
      : primaryArea === "guest"
        ? experience?.domain === "hospitality"
          ? "STAY"
          : "VISIT"
        : experience
          ? PERSONAL_SPACE_LABEL[experience.domain]
          : "ACCESS";

  return {
    id: `party:${workspace.place.id}`,
    type: "party",
    category: experience
      ? `${experience.label.toUpperCase()} ${areaLabel}`
      : PARTY_CATEGORY[primaryArea],
    title: selectionName,
    roleLabel: roleLabels.join(" · "),
    destination: `/workspace/${workspace.place.id}`,
    useCase,
    // ``selectedSite`` is the Site, never the Place: the plugin and admin
    // guards read it as ``X-Site``.
    selection: workspace.place.site_id
      ? {
          id: workspace.place.site_id,
          name: workspace.place.site_name ?? selectionName,
        }
      : undefined,
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
    workspaces.push(siteCard(siteWorkspace));
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
