"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  getResidencyRoles,
  getResidencyWorkspacePath,
  getWorkspaceRoleLabel,
  resolveResidencyRole,
} from "@/lib/workspace-context";
import { useResidentDashboardSelect } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import type { ResidencyWorkspaceRole } from "@/types";

const roleMeta: Record<
  ResidencyWorkspaceRole,
  { label: string; Icon: typeof Home; description: string }
> = {
  resident: {
    label: "Resident view",
    Icon: Home,
    description: "Visitors, passes, and home operations",
  },
  staff: {
    label: "Staff view",
    Icon: Briefcase,
    description: "Movement, KYC, and work access",
  },
};

export function ResidencyRoleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: dashboardData } = useResidentDashboardSelect();
  const {
    selectedResidency,
    selectedResidencyRole,
    setSelectedResidencyRole,
  } = useAppStore();

  const residencyId = useMemo(() => {
    const match = pathname?.match(/^\/residency\/([^/]+)/);
    return match?.[1] ?? selectedResidency?.id ?? null;
  }, [pathname, selectedResidency?.id]);

  const availableRoles = useMemo(
    () => getResidencyRoles(dashboardData, residencyId),
    [dashboardData, residencyId],
  );

  const activeRole = useMemo<ResidencyWorkspaceRole>(() => {
    if (pathname?.startsWith(`/residency/${residencyId}/staff`)) {
      return "staff";
    }
    return resolveResidencyRole(dashboardData, residencyId, selectedResidencyRole, dashboardData?.user);
  }, [dashboardData, pathname, residencyId, selectedResidencyRole]);

  useEffect(() => {
    if (selectedResidencyRole !== activeRole) {
      setSelectedResidencyRole(activeRole);
    }
  }, [activeRole, selectedResidencyRole, setSelectedResidencyRole]);

  if (!residencyId || availableRoles.length <= 1) {
    return null;
  }

  const handleSwitch = (role: ResidencyWorkspaceRole) => {
    setSelectedResidencyRole(role);
    router.push(getResidencyWorkspacePath(residencyId, role));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Residency context
        </p>
        <p className="text-sm text-foreground">
          Switch between the roles you hold in this residency.
        </p>
      </div>

      <div className="inline-flex rounded-xl border border-border/60 bg-background p-1">
        {availableRoles.map((role) => {
          const { label, Icon, description } = roleMeta[role];
          const isActive = activeRole === role;

          return (
            <Button
              key={role}
              type="button"
              variant="ghost"
              onClick={() => handleSwitch(role)}
              className={cn(
                "h-auto rounded-lg px-3 py-2 text-left",
                isActive &&
                "bg-[rgb(var(--brand-primary))/0.10] text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary))/0.14]",
              )}
            >
              <span className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="flex flex-col">
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {description}
                  </span>
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}