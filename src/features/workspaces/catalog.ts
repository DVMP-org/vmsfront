import type { Admin, WorkspaceRelationship } from "@/types";
import { hasAdminPermission } from "@/lib/permissions";

export type WorkspaceArea = "management" | "occupancy" | "staff" | "guest";

export interface WorkspaceCard {
  key: string;
  area: WorkspaceArea;
  title: string;
  subtitle: string;
  roleLabel: string;
  href: string;
  relationship?: WorkspaceRelationship;
  place?: WorkspaceCardPlace;
}

export type WorkspaceCardPlace = Partial<PropertyWorkspacePlace> &
  Pick<PropertyWorkspacePlace, "id" | "name">;

export interface PropertyAccess {
  area: WorkspaceArea;
  title: string;
  description: string;
  roleLabel: string;
  href: string;
}

export interface PropertyWorkspace {
  key: string;
  place: PropertyWorkspacePlace;
  placePath: PropertyWorkspacePlace[];
  accesses: PropertyAccess[];
}

export type PropertyWorkspacePlace = Omit<
  WorkspaceRelationship["place"],
  "slug"
> & {
  slug?: string;
};

export function workspaceDisplayName(workspace: PropertyWorkspace): string {
  return qualifiedPlaceName(workspace.place, workspace.placePath);
}

export function qualifiedPlaceName(
  place: PropertyWorkspacePlace,
  placePath: PropertyWorkspacePlace[] = [place],
): string {
  if (place.kind === "site") return place.name;
  const siteName =
    place.site_name?.trim() ||
    placePath.find((ancestor) => ancestor.kind === "site")?.name;
  return siteName ? `${siteName} - ${place.name}` : place.name;
}

const OCCUPANCY_ROLES = new Set([
  "resident",
  "resident_of",
  "owner",
  "tenant",
  "member",
  "member_of",
]);
const STAFF_ROLES = new Set([
  "employee",
  "staff",
  "hotel_staff",
  "operator",
  "manager",
]);
const GUEST_ROLES = new Set(["guest", "guest_of"]);
const ADMIN_RELATIONSHIP_ROLES = new Set(["admin", "super_admin"]);

export function areaForRelationship(
  relationship: WorkspaceRelationship,
): WorkspaceArea {
  const role = relationship.role.toLowerCase();
  if (GUEST_ROLES.has(role)) return "guest";
  if (STAFF_ROLES.has(role)) return "staff";
  if (OCCUPANCY_ROLES.has(role)) return "occupancy";
  return "occupancy";
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "Administrator",
    super_admin: "Super administrator",
    guest_of: "Guest",
    resident_of: "Resident",
    member_of: "Member",
    hotel_staff: "Hotel staff",
  };
  return (
    labels[role.toLowerCase()] ||
    role
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

export function canOpenManagementDashboard(
  placeId: string | null | undefined,
  isPlaceAdministrator: boolean | undefined,
): boolean {
  return !!placeId && !!isPlaceAdministrator;
}

export function buildWorkspaceCards(
  admin: Admin | null | undefined,
  relationships: WorkspaceRelationship[],
  managementPlace?: WorkspaceCardPlace | null,
): WorkspaceCard[] {
  const cards: WorkspaceCard[] = [];
  if (admin && managementPlace) {
    const managementRole = admin.role?.name || "Administrator";
    cards.push({
      key: `management:${managementPlace.id}`,
      area: "management",
      title: `${managementPlace.name} management`,
      subtitle:
        "Property people, finance, access and operating workflows.",
      roleLabel:
        managementRole === "Super Admin"
          ? "Super administrator"
          : managementRole,
      href: "/admin",
      place: managementPlace,
    });
  }

  for (const relationship of relationships) {
    if (ADMIN_RELATIONSHIP_ROLES.has(relationship.role.toLowerCase())) {
      continue;
    }
    const area = areaForRelationship(relationship);
    cards.push({
      key: `${area}:${relationship.id}`,
      area,
      title:
        area === "guest"
          ? `Stay at ${relationship.place.name}`
          : area === "staff"
            ? `Work at ${relationship.place.name}`
            : relationship.place.name,
      subtitle:
        area === "guest"
          ? "Guest access, stay information and arrival details."
          : area === "staff"
            ? "Operational access without organization-wide administration."
            : "Your permitted occupancy and property access.",
      roleLabel: roleLabel(relationship.role),
      href: `/workspace/${relationship.place.id}`,
      relationship,
    });
  }
  return cards;
}

export const workspaceAreaMeta: Record<
  WorkspaceArea,
  { title: string; description: string }
> = {
  management: {
    title: "Management",
    description:
      "Administrative access is separate from occupancy and guest access.",
  },
  occupancy: {
    title: "Occupancy & tenancy",
    description: "Resident, owner, tenant and member workspaces.",
  },
  staff: {
    title: "Staff access",
    description: "Operational access for employees and assigned teams.",
  },
  guest: {
    title: "Hospitality stays",
    description:
      "Guest access only. Reservations and room changes remain with hotel staff.",
  },
};

export function buildPropertyWorkspaces({
  admin,
  relationships,
  managedPlaces = [],
  managementRole: managementRoleOverride,
}: {
  admin: Admin | null | undefined;
  relationships: WorkspaceRelationship[];
  managedPlaces?: PropertyWorkspacePlace[];
  managementRole?: string | null;
}): PropertyWorkspace[] {
  const canManagePlaces = hasAdminPermission(admin, [
    "places.list",
    "place_relationships.create",
  ]);
  const byPlace = new Map<string, PropertyWorkspace>();
  const managedPlaceById = new Map(
    managedPlaces.map((place) => [place.id, place]),
  );
  const hierarchyFor = (place: PropertyWorkspacePlace) => {
    const path: PropertyWorkspacePlace[] = [];
    const seen = new Set<string>();
    let current: PropertyWorkspacePlace | undefined =
      managedPlaceById.get(place.id) || place;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      path.unshift(current);
      current = current.parent_id
        ? managedPlaceById.get(current.parent_id)
        : undefined;
    }
    return path;
  };
  const ensure = (place: PropertyWorkspacePlace) => {
    const current = byPlace.get(place.id);
    if (current) return current;
    const managedPlace = managedPlaceById.get(place.id);
    const mergedPlace = managedPlace ? { ...place, ...managedPlace } : place;
    const workspace: PropertyWorkspace = {
      key: place.id,
      place: mergedPlace,
      placePath: hierarchyFor(mergedPlace),
      accesses: [],
    };
    byPlace.set(place.id, workspace);
    return workspace;
  };
  const managementRole =
    managementRoleOverride?.trim() || admin?.role?.name || "Administrator";
  const managementAccess = (label: string): PropertyAccess => ({
    area: "management",
    title: "Management console",
    description:
      "Properties, people, billing, access control and organization operations.",
    roleLabel:
      label === "Super Admin" ? "Super administrator" : roleLabel(label),
    href: "/admin",
  });

  for (const relationship of relationships) {
    const role = relationship.role.toLowerCase();
    const workspace = ensure(relationship.place);
    if (ADMIN_RELATIONSHIP_ROLES.has(role)) {
      addAccess(workspace, managementAccess(managementRole));
      continue;
    }
    const area = areaForRelationship(relationship);
    const roleText = roleLabel(relationship.role);
    const title =
      area === "guest"
        ? "Guest stay"
        : area === "staff"
          ? "Staff workspace"
          : roleText === "Tenant"
            ? "Tenancy workspace"
            : roleText === "Owner"
              ? "Owner workspace"
              : "Resident workspace";
    const description =
      area === "guest"
        ? "Stay and arrival details. Bookings and room assignment stay with hotel staff."
        : area === "staff"
          ? "Assigned operational tools. Organization management remains separate."
          : "Home, charges, visitors and access for your personal membership.";
    addAccess(workspace, {
      area,
      title,
      description,
      roleLabel: roleText,
      href: `/workspace/${relationship.place.id}`,
    });
  }

  if (canManagePlaces) {
    for (const place of managedPlaces) {
      if (place.parent_id) continue;
      addAccess(ensure(place), managementAccess(managementRole));
    }
  }

  const areaOrder: WorkspaceArea[] = [
    "management",
    "occupancy",
    "staff",
    "guest",
  ];
  return Array.from(byPlace.values())
    .filter((workspace) => workspace.accesses.length)
    .sort((left, right) => {
      const leftManaged = left.accesses.some(
        (access) => access.area === "management",
      );
      const rightManaged = right.accesses.some(
        (access) => access.area === "management",
      );
      return Number(rightManaged) - Number(leftManaged);
    })
    .map((workspace) => ({
      ...workspace,
      accesses: workspace.accesses.sort(
        (left, right) =>
          areaOrder.indexOf(left.area) - areaOrder.indexOf(right.area),
      ),
    }));
}

function addAccess(workspace: PropertyWorkspace, access: PropertyAccess) {
  const current = workspace.accesses.find(
    (item) => item.area === access.area && item.href === access.href,
  );
  if (current) {
    const labels = new Set(current.roleLabel.split(" · "));
    labels.add(access.roleLabel);
    current.roleLabel = Array.from(labels).join(" · ");
    return;
  }
  workspace.accesses.push(access);
}
