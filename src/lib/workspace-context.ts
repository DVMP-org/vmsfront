import type {
  DashboardSelect,
  ResidencyWorkspaceAccess,
  ResidencyWorkspaceRole,
  UserProfile,
} from "@/types";

export const DEFAULT_RESIDENCY_ROLE: ResidencyWorkspaceRole = "resident";

function dedupeRoles(
  roles: ResidencyWorkspaceRole[] | undefined,
): ResidencyWorkspaceRole[] {
  if (!roles?.length) return [DEFAULT_RESIDENCY_ROLE];
  return Array.from(new Set(roles));
}

/**
 * Determine the default role based on user profile flags.
 * Staff-only users (is_staff && !is_resident) should default to "staff".
 */
export function getDefaultRoleForUser(user?: UserProfile | null): ResidencyWorkspaceRole {
  if (!user) return DEFAULT_RESIDENCY_ROLE;
  const isResident = user.is_resident ?? false;
  const isStaff = user.is_staff ?? false;

  // Staff-only users should default to staff workspace
  if (isStaff && !isResident) {
    return "staff";
  }
  return DEFAULT_RESIDENCY_ROLE;
}

export function getResidencyAccessList(
  dashboardData?: DashboardSelect | null,
): ResidencyWorkspaceAccess[] {
  const explicitAccess = dashboardData?.residency_access ?? [];
  const fallbackResidencies = dashboardData?.residencies ?? [];

  const accessMap = new Map<string, ResidencyWorkspaceAccess>();

  explicitAccess.forEach((access) => {
    accessMap.set(access.residency_id, {
      residency_id: access.residency_id,
      roles: dedupeRoles(access.roles),
      default_role:
        access.default_role && access.roles?.includes(access.default_role)
          ? access.default_role
          : dedupeRoles(access.roles)[0],
    });
  });

  fallbackResidencies.forEach((residency) => {
    if (!accessMap.has(residency.id)) {
      accessMap.set(residency.id, {
        residency_id: residency.id,
        roles: [DEFAULT_RESIDENCY_ROLE],
        default_role: DEFAULT_RESIDENCY_ROLE,
      });
    }
  });

  return Array.from(accessMap.values());
}

export function getResidencyRoles(
  dashboardData: DashboardSelect | null | undefined,
  residencyId: string | null | undefined,
): ResidencyWorkspaceRole[] {
  if (!residencyId) return [DEFAULT_RESIDENCY_ROLE];
  const match = getResidencyAccessList(dashboardData).find(
    (access) => access.residency_id === residencyId,
  );
  return match?.roles?.length ? match.roles : [DEFAULT_RESIDENCY_ROLE];
}

export function resolveResidencyRole(
  dashboardData: DashboardSelect | null | undefined,
  residencyId: string | null | undefined,
  requestedRole?: ResidencyWorkspaceRole | null,
  user?: UserProfile | null,
): ResidencyWorkspaceRole {
  const userDefaultRole = getDefaultRoleForUser(user);
  const roles = getResidencyRoles(dashboardData, residencyId);

  // If requested role is valid for this residency, use it
  if (requestedRole && roles.includes(requestedRole)) {
    return requestedRole;
  }

  // Check explicit access configuration
  const explicit = getResidencyAccessList(dashboardData).find(
    (access) => access.residency_id === residencyId,
  );

  if (explicit?.default_role && roles.includes(explicit.default_role)) {
    return explicit.default_role;
  }

  // If user's default role based on profile is valid for this residency, use it
  if (roles.includes(userDefaultRole)) {
    return userDefaultRole;
  }

  return roles[0] ?? userDefaultRole;
}

export function getResidencyWorkspacePath(
  residencyId: string,
  role: ResidencyWorkspaceRole,
): string {
  return role === "staff"
    ? `/residency/${residencyId}/staff`
    : `/residency/${residencyId}`;
}

export function getWorkspaceRoleLabel(role: ResidencyWorkspaceRole): string {
  return role === "staff" ? "Staff" : "Resident";
}