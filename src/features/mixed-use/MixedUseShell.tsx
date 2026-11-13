"use client";

import type { QueryContext } from "@/lib/query-keys";
import type { ReactNode } from "react";
import { Building2, ShieldCheck } from "lucide-react";

import { SitePicker } from "@/components/sites/SitePicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSiteAccess } from "@/features/context/use-site-access";
import { useAppStore } from "@/store/app-store";

export function useMixedUseAccess() {
  const access = useSiteAccess();
  const profile = access.workspace;
  const organization = useAppStore((state) => state.organization);
  const selectedSite = useAppStore((state) => state.selectedSite);
  return {
    profile,
    organization,
    selectedSite,
    contextKey: access.contextKey,
    canManageFacilities: access.allowed("places.update"),
    canManageExpenses: access.allowed("charges.create"),
  };
}

export function MixedUseShell({
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
    selectedSite,
    contextKey,
    canManageFacilities,
    canManageExpenses,
  } = useMixedUseAccess();
  const manager = canManageFacilities || canManageExpenses;

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--vms-coral)]" />
            Mixed-use operations
          </span>
        }
        title={title}
        description={description}
        metadata={
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
            <Badge variant="neutral">
              {organization?.name || "Organization"}
            </Badge>
            {selectedSite ? (
              <Badge variant="neutral">
                <Building2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {selectedSite.name}
              </Badge>
            ) : (
              <Badge variant="warning">No property selected</Badge>
            )}
            <Badge variant="neutral">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {manager ? "Management access" : "Read-only access"}
            </Badge>
          </div>
        }
        primaryAction={selectedSite ? primaryAction : undefined}
      />

      {!selectedSite ? (
        <PropertyContext contextKey={contextKey} />
      ) : profile.isError ? (
        <section
          role="alert"
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-danger)]"
        >
          <p className="font-semibold">
            Mixed-use permissions are unavailable.
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

function PropertyContext({ contextKey: _contextKey }: { contextKey: QueryContext }) {
  const selectedSite = useAppStore((state) => state.selectedSite);
  const setSelectedSite = useAppStore((state) => state.setSelectedSite);
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-7">
      <h2 className="text-lg font-semibold">Choose a mixed-use property</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
        Shared facilities and allocated expenses are scoped to the property
        selected in the workspace.
      </p>
      <div className="mt-5 max-w-xl">
        <SitePicker
          label="Mixed-use property"
          value={selectedSite}
          onChange={setSelectedSite}
        />
      </div>
    </section>
  );
}
