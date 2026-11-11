"use client";

import { OrganizationMemberGuard } from "@/components/auth/OrganizationMemberGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { WorkspaceLobbyPage } from "@/features/workspaces/WorkspaceLobbyPage";

export default function WorkspaceLobbyRoute() {
  return (
    <RouteGuard>
      <OrganizationMemberGuard>
        <WorkspaceLobbyPage />
      </OrganizationMemberGuard>
    </RouteGuard>
  );
}
