"use client";

import { domainExperience } from "@/config/domains";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import {
  DashboardSkeleton,
  PanelState,
} from "@/features/dashboard/DashboardPrimitives";
import DefaultAdminOverview from "@/features/dashboard/DefaultAdminOverview";
import ResidentialOverview from "@/features/residential/ResidentialOverview";
import CommercialOverview from "@/features/commercial/CommercialOverview";
import HospitalityOverview from "@/features/hospitality/HospitalityOverview";
import { MixedUseOverview } from "@/features/mixed-use/MixedUseOverview";
import { parseApiError } from "@/lib/error-utils";

const overviews = {
  residential: ResidentialOverview,
  commercial: CommercialOverview,
  hospitality: HospitalityOverview,
  mixed_use: MixedUseOverview,
};

export default function AdminDashboardPage() {
  const workspace = useWorkspaceContext();
  if (workspace.isPending) return <DashboardSkeleton />;
  if (workspace.isError)
    return (
      <PanelState
        kind="error"
        title="Workspace unavailable"
        description={parseApiError(workspace.error).message}
        onRetry={() => workspace.refetch()}
      />
    );
  const experience = domainExperience(workspace.data?.effective_use_case);
  const Overview = experience
    ? overviews[experience.dashboard.component]
    : DefaultAdminOverview;
  return <Overview />;
}
