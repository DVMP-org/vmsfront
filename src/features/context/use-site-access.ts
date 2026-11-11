"use client";

import { useMemo } from "react";

import { queryKeys } from "@/lib/query-keys";
import { hasPermissionGrant } from "@/lib/permissions";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { workspacePermissions } from "./api";
import { useWorkspaceContext } from "./use-workspace-context";

/**
 * Site surfaces must authorize against Site RBAC only. Organization
 * administration grants are deliberately excluded even when one User holds
 * both kinds of authority.
 */
export function useSiteAccess() {
  const workspace = useWorkspaceContext();
  const organization = useAppStore((state) => state.organization);
  const site = useAppStore((state) => state.selectedProperty);
  const activeSite =
    workspace.data?.management?.selected_site ||
    site ||
    workspace.data?.management?.authoritative_site ||
    null;
  const user = useAuthStore((state) => state.user);
  const permissions = useMemo(
    () => workspacePermissions(workspace.data),
    [workspace.data],
  );
  const contextKey = useMemo(
    () => queryKeys.scope(organization?.id, activeSite?.id, user?.id),
    [organization?.id, activeSite?.id, user?.id],
  );
  return {
    workspace,
    permissions,
    contextKey,
    allowed: (requirement: string | string[]) =>
      hasPermissionGrant(permissions, requirement),
    isAdministrator: workspace.data?.management?.is_administrator === true,
  };
}
