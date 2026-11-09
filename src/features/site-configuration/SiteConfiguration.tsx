"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Cable,
  CalendarClock,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlaceModulesPanel } from "@/features/modules/PlaceModulesPanel";
import { CheckpointPolicyPanel } from "@/features/checkpoints/CheckpointPolicyPanel";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { propertiesApi } from "@/features/properties/api";
import { useAppStore } from "@/store/app-store";
import { useQuery } from "@tanstack/react-query";

export function SiteConfiguration() {
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const workspace = useWorkspaceContext();
  const property = useQuery({
    queryKey: ["site-configuration-place", selectedProperty?.id],
    queryFn: () => propertiesApi.get(selectedProperty!.id),
    enabled: !!selectedProperty?.id,
    retry: false,
  });

  if (!selectedProperty?.id) {
    return (
      <main className="space-y-5 pb-10">
        <header className="border-b border-[var(--vms-line)] pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Site administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Site configuration
          </h1>
        </header>
        <EmptyState
          title="Select a site workspace"
          description="Site modules and operating configuration are managed inside a site workspace."
          action={
            <Button asChild>
              <Link href="/admin/properties">Open properties</Link>
            </Button>
          }
        />
      </main>
    );
  }

  if (property.isPending) {
    return <p role="status">Loading site configuration…</p>;
  }
  if (property.isError) {
    return (
      <InlineAlert
        tone="danger"
        title="Site configuration could not be loaded"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => property.refetch()}
          >
            Retry
          </Button>
        }
      >
        The selected site may no longer be available in this organization.
      </InlineAlert>
    );
  }
  if (property.data.kind !== "site") {
    return (
      <InlineAlert
        tone="warning"
        title="This workspace is not a site"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/properties/${property.data.id}`}>
              Open property
            </Link>
          </Button>
        }
      >
        Operating modules are configured on the site. Child buildings, units,
        rooms and spaces inherit the site capability set.
      </InlineAlert>
    );
  }

  const canManage = workspace.data?.management?.is_administrator === true;

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <header className="flex flex-col gap-4 border-b border-[var(--vms-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Site administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {property.data.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Configure the operating capabilities and site-wide defaults used
            throughout this workspace.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/properties/${property.data.id}`}>
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            General details
          </Link>
        </Button>
      </header>

      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Site configuration summary"
      >
        <article className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <Building2
            className="h-5 w-5 text-[var(--vms-ink-muted)]"
            aria-hidden="true"
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
            Operating context
          </p>
          <p className="mt-1 text-lg font-semibold capitalize">
            {(
              property.data.use_case ??
              workspace.data?.effective_use_case ??
              ""
            )
              .toString()
              .replaceAll("_", " ")}
          </p>
        </article>
        <article className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <ShieldCheck
            className="h-5 w-5 text-[var(--vms-ink-muted)]"
            aria-hidden="true"
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
            Management
          </p>
          <p className="mt-1 text-lg font-semibold">
            {workspace.data?.management?.mode === "local"
              ? "Local site"
              : workspace.data?.management?.mode === "inherited"
                ? "Inherited"
                : "Unavailable"}
          </p>
        </article>
        <article className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <Cable
            className="h-5 w-5 text-[var(--vms-ink-muted)]"
            aria-hidden="true"
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
            Shared services
          </p>
          <p className="mt-1 text-lg font-semibold">Organization-wide</p>
          <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
            Plugins and integrations are configured once for every place.
          </p>
        </article>
      </section>

      <PlaceModulesPanel
        placeId={property.data.id}
        placeName={property.data.name}
        canEdit={canManage}
      />

      <CheckpointPolicyPanel placeId={property.data.id} canEdit={canManage} />

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <header className="border-b border-[var(--vms-line)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Access automation
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">
            Checkpoint operation
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--vms-ink-muted)]">
            Checkpoints use one accountable site administrator. Passage capture
            derives that assignment from the signed-in administrator unless an
            explicit checkpoint header is supplied.
          </p>
        </header>
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b border-[var(--vms-line)] p-5 md:border-b-0 md:border-r">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <h3 className="mt-3 font-semibold">Manual operator assignment</h3>
            <p className="mt-1 text-sm leading-5 text-[var(--vms-ink-muted)]">
              Assign or reassign an active site administrator to each
              checkpoint. Reassignment preserves the prior operator in history.
            </p>
            <Link
              href="/admin/gates"
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
            >
              Manage checkpoint operators
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <CalendarClock className="h-5 w-5" aria-hidden="true" />
              <span className="rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-2.5 py-1 text-xs font-semibold">
                Planned
              </span>
            </div>
            <h3 className="mt-3 font-semibold">Automatic rotation</h3>
            <p className="mt-1 text-sm leading-5 text-[var(--vms-ink-muted)]">
              Frequency-based assignment policies and operator notifications are
              tracked in the MVP backlog. No unsupported automation is enabled
              from this page.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
