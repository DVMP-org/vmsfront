import { AdminRole } from "@/types";

/**
 * Checks if a role has the required permission(s).
 * Supports dot notation (parsed) and resource-action object formats.
 *
 * @param role The admin role containing permissions
 * @param requirement A single permission string (e.g., "residents.list") or an array of strings (OR logic)
 * @returns boolean True if any requirement is met
 */
export function hasPermission(
    role: AdminRole | null | undefined,
    requirement: string | string[]
): boolean {
    if (!role) return false;

    const requirements = Array.isArray(requirement) ? requirement : [requirement];

    // 1. Check permissions_parsed (Dot notation array: ["residents.list", "users.show"])
    const parsed = role.permissions_parsed || [];
    if (parsed.includes("*")) return true;
    if (requirements.some((req) => parsed.includes(req))) return true;

    // 2. Check permissions (Original format: Object, Array, or String)
    const perms = role.permissions;

    // Case: Super admin string wildcard
    if (perms === "*") return true;

    // Case: Array format
    if (Array.isArray(perms)) {
        if (perms.includes("*")) return true;
        if (requirements.some((req) => perms.includes(req))) return true;
    }

    // Case: Object format (Record<string, string[]>)
    // e.g., { "residents": ["list", "show"], "users": ["*"] }
    if (typeof perms === "object" && perms !== null) {
        const permObj = perms as Record<string, string[]>;

        // Global wildcard in object format: { "*": ["*"] }
        if (permObj["*"]?.includes("*")) return true;

        for (const req of requirements) {
            const parts = req.split(".");
            if (parts.length < 2) {
                // Handle cases where the requirement is just "resource"
                if (permObj[req] && permObj[req].length > 0) return true;
                continue;
            }

            const [resource, action] = parts;

            // Check specific resource-action
            if (permObj[resource]?.includes(action)) return true;

            // Check resource-wide wildcard: { "residents": ["*"] }
            if (permObj[resource]?.includes("*")) return true;
        }
    }

    return false;
}

/**
 * Administrative grants use the effective RBAC union when available and fall
 * back to the current server role payload until RBAC-01 is integrated.
 */
export function hasAdminPermission(
    admin:
        | {
              effective_permissions?: string[];
              roles?: AdminRole[];
              role?: AdminRole | null;
          }
        | null
        | undefined,
    requirement: string | string[],
): boolean {
    if (!admin) return false;
    if (Array.isArray(admin.effective_permissions)) {
        const permissions = admin.effective_permissions;
        if (permissions.includes("*")) return true;
        return (Array.isArray(requirement) ? requirement : [requirement]).some(
            (permission) =>
                permissions.includes(permission) ||
                permissions.includes(`${permission.split(".")[0]}.*`),
        );
    }
    const roles = admin.roles?.length ? admin.roles : admin.role ? [admin.role] : [];
    return roles.some((role) => hasPermission(role, requirement));
}
