"use client";

import type { ReactNode } from "react";
import { Building2, ShieldCheck } from "lucide-react";

import { SitePicker } from "@/components/sites/SitePicker";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/app-store";
import { useSiteAccess } from "@/features/context/use-site-access";
import { ResidentialModuleNav } from "./ResidentialModuleNav";

export function useResidentialAccess() {
  const access = useSiteAccess();
  const organization = useAppStore((state) => state.organization);
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const can = access.allowed;

  return {
    profile: access.workspace,
    organization,
    selectedProperty,
    contextKey: access.contextKey,
    canListUnits: can("places.list"),
    canManageUnits: can("places.create") || can("places.update"),
    canManagePeople: can("place_relationships.create") || can("parties.create"),
    canManageFinance: can("charges.create") || can("charges.update"),
    canManageMaintenance:
      can("maintenance.manage") || can("places.update") || can("places.create"),
    canManageAnnouncements:
      can("announcements.create") ||
      can("forum_posts.create") ||
      can("places.update"),
    canManageVisitors: can("visit_authorizations.approve"),
  };
}

export function ResidentialShell({
  title,
  description,
  primaryAction,
  children,
}: {
  title: string;
  description: string;
  primaryAction?: ReactNode;
  children: ReactNode;
}) {
  const {
    profile,
    organization,
    selectedProperty,
    contextKey,
    canManageUnits,
  } = useResidentialAccess();

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--vms-coral)]" />
            Residential operations
          </span>
        }
        title={title}
        description={description}
        metadata={
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
            <Badge variant="neutral">
              {organization?.name || "Organization"}
            </Badge>
            {selectedProperty ? (
              <Badge variant="neutral">
                <Building2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {selectedProperty.name}
              </Badge>
            ) : (
              <Badge variant="warning">No property selected</Badge>
            )}
            {profile.isPending ? (
              <Badge variant="neutral">Checking permissions</Badge>
            ) : (
              <Badge variant="neutral">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {canManageUnits ? "Management access" : "Read-only access"}
              </Badge>
            )}
          </div>
        }
        primaryAction={primaryAction}
      />

      <ResidentialModuleNav />

      {!selectedProperty ? (
        <PropertyContext contextKey={contextKey} />
      ) : profile.isError ? (
        <section
          role="alert"
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-danger)]"
        >
          <p className="font-semibold">
            Residential permissions are unavailable.
          </p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => profile.refetch()}
          >
            Retry permissions
          </Button>
        </section>
      ) : (
        children
      )}
    </main>
  );
}

function PropertyContext({ contextKey: _contextKey }: { contextKey: string }) {
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const setSelectedProperty = useAppStore((state) => state.setSelectedProperty);
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-7">
      <h2 className="text-lg font-semibold">Choose a residential property</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
        Units, households, leases, charges, requests and announcements are
        scoped to the property selected in the workspace.
      </p>
      <div className="mt-5 max-w-xl">
        <SitePicker
          label="Residential property"
          value={selectedProperty}
          onChange={setSelectedProperty}
        />
      </div>
    </section>
  );
}
