"use client";

import type { ReactNode } from "react";
import { WorkspaceContext } from "@/components/ui/WorkspaceContext";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

import { SitePicker } from "@/components/sites/SitePicker";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAppStore } from "@/store/app-store";
import { useSiteAccess } from "@/features/context/use-site-access";

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
  showWorkspace = false,
}: {
  title: string;
  description: string;
  primaryAction?: ReactNode;
  children: ReactNode;
  showWorkspace?: boolean;
}) {
  const { profile, selectedProperty, contextKey } = useResidentialAccess();

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      {/* {showWorkspace && selectedProperty && (
        <WorkspaceContext
          name={selectedProperty.name}
          description="Residential"
        />
      )} */}
      <PageHeader
        breadcrumbs={
          selectedProperty && !showWorkspace ? (
            <Breadcrumbs
              className="mb-5"
              items={[
                {
                  label: "Property workspace",
                  href: "/?lobby=1",
                },
                { label: selectedProperty.name },
                { label: title },
              ]}
            />
          ) : undefined
        }
        title={title}
        description={description}
        className="border-0 pb-0"
        primaryAction={primaryAction}
      />

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
