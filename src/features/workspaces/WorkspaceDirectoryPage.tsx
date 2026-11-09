"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  ConciergeBell,
  Home,
  KeyRound,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  buildPropertyWorkspaces,
  workspaceDisplayName,
  type PropertyAccess,
  type PropertyWorkspace,
  type WorkspaceArea,
} from "@/features/workspaces/catalog";
import { useVerifyToken } from "@/hooks/use-auth";
import { useRequireEmailVerification } from "@/hooks/use-email-verification-guard";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { domainExperience } from "@/config/domains";
import { useAppStore } from "@/store/app-store";
import { ActionCard } from "@/components/ui/ActionCard";

const accessIcon = {
  management: ShieldCheck,
  occupancy: Home,
  staff: BriefcaseBusiness,
  guest: ConciergeBell,
};

const roleBadgeClass: Record<WorkspaceArea, string> = {
  management:
    "border border-[color-mix(in_srgb,var(--vms-success)_35%,white)] bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
  occupancy:
    "border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
  staff:
    "border border-[color-mix(in_srgb,var(--vms-info)_35%,white)] bg-[color-mix(in_srgb,var(--vms-info)_10%,white)] text-[var(--vms-info)]",
  guest:
    "border border-[color-mix(in_srgb,var(--vms-warning)_35%,white)] bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]",
};

export function WorkspaceDirectoryPage() {
  const router = useRouter();
  const organization = useAppStore((state) => state.organization);
  const setSelectedProperty = useAppStore((state) => state.setSelectedProperty);
  const context = useVerifyToken();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  useRequireEmailVerification(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "management-required") {
      setNotice(
        "That management area belongs to a selected property. Choose a property where you have administrator authority.",
      );
    }
  }, []);

  const loading = context.isPending;
  const workspaces = buildPropertyWorkspaces({
    relationships: context.data?.workspaces || [],
    managedSites: context.data?.site_workspaces || [],
  });
  const selectedWorkspace =
    workspaces.find((workspace) => workspace.key === selectedPropertyId) ||
    workspaces[0];
  const accessCount = workspaces.reduce(
    (total, workspace) => total + workspace.accesses.length,
    0,
  );
  const managedPropertyCount = workspaces.filter((workspace) =>
    workspace.accesses.some((access) => access.area === "management"),
  ).length;
  const personalAccessCount = workspaces.reduce(
    (total, workspace) =>
      total +
      workspace.accesses.filter((access) => access.area !== "management")
        .length,
    0,
  );
  const managementRole = workspaces
    .flatMap((workspace) => workspace.accesses)
    .find((access) => access.area === "management")?.roleLabel;
  const userName =
    context.data?.user.name ||
    context.data?.party?.display_name ||
    context.data?.user.email ||
    "Current user";

  function openAccess(workspace: PropertyWorkspace, access: PropertyAccess) {
    setSelectedProperty({
      id: workspace.place.id,
      name: workspaceDisplayName(workspace),
    });
    const experience = domainExperience(
      workspace.place.use_case ?? organization?.use_case,
    );
    const destination =
      access.area === "management"
        ? (experience?.navigation[0]?.items[0]?.href ?? access.href)
        : access.href;
    router.push(destination);
  }

  return (
    <div className="workspace-switcher space-y-5 text-[var(--vms-ink)]">
      <header className="mb-5">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
          <Building2 className="h-4 w-4" />
          {organization?.name || "Organization"}
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-[var(--vms-ink)] sm:text-[32px]">
          Choose your workspace
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--vms-ink-muted)]">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--vms-surface-subtle)] text-[11px] font-semibold uppercase text-[var(--vms-ink)]">
            {initials(userName)}
          </span>
          <span className="font-semibold text-[var(--vms-ink)]">
            {userName}
          </span>
          <span className="hidden h-5 w-px bg-[var(--vms-line)] sm:block" />
          <span>
            Role:{" "}
            <span className="font-medium text-[var(--vms-ink)]">
              {managementRole || "Organization member"}
            </span>
          </span>
          <span className="hidden h-5 w-px bg-[var(--vms-line)] sm:block" />
          <span>
            Organization:{" "}
            <span className="font-medium text-[var(--vms-ink)]">
              {organization?.name || "Current organization"}
            </span>
          </span>
        </div>
      </header>

      {notice ? (
        <div
          role="status"
          className="mb-5 flex items-start gap-3 rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-warning)_35%,white)] bg-[var(--vms-warning-subtle)] px-4 py-3 text-sm text-[var(--vms-warning)]"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      <section
        aria-label="Workspace summary"
        className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric icon={Building2} label="Properties" value={workspaces.length} />
        <Metric
          icon={ShieldCheck}
          label="Management"
          value={managedPropertyCount}
        />
        <Metric
          icon={UserRound}
          label="Personal access"
          value={personalAccessCount}
        />
        <Metric icon={KeyRound} label="Active accesses" value={accessCount} />
      </section>

      {context.isError ? (
        <StatusPanel
          title="Workspaces could not be verified."
          detail={parseApiError(context.error).message}
          onRetry={() => context.refetch()}
        />
      ) : loading ? (
        <WorkspaceSkeleton />
      ) : workspaces.length === 0 ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-dashed border-[var(--vms-line-strong)] bg-[var(--vms-surface)] p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-[var(--vms-ink-muted)]" />
          <h2 className="mt-4 text-lg font-semibold">No workspace access</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--vms-ink-muted)]">
            Your account has no active management, residency, tenancy, staff or
            guest role in this organization.
          </p>
        </section>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
            <div className="border-b border-[var(--vms-line)] px-4 py-4">
              <h2 className="text-base font-semibold tracking-[-0.02em]">
                Properties ({workspaces.length})
              </h2>
              <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                Select a property to view available access.
              </p>
            </div>
            <div
              className="max-h-[560px] space-y-1 overflow-y-auto p-2"
              aria-label="Properties"
            >
              {workspaces.map((workspace) => (
                <PropertyListItem
                  key={workspace.key}
                  workspace={workspace}
                  organizationUseCase={organization?.use_case}
                  selected={selectedWorkspace?.key === workspace.key}
                  onSelect={() => setSelectedPropertyId(workspace.key)}
                />
              ))}
            </div>
          </aside>

          {selectedWorkspace ? (
            <PropertyWorkspaceDetail
              workspace={selectedWorkspace}
              organizationUseCase={organization?.use_case}
              onOpen={openAccess}
            />
          ) : null}
        </div>
      )}

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--vms-ink-muted)]">
        <p>
          Management rights do not create resident, tenant or guest membership.
        </p>
        <Link
          href="/organization"
          className="font-semibold text-[var(--vms-action)] hover:underline"
        >
          Organization home
        </Link>
      </footer>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-4 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-2xl font-semibold tabular-nums tracking-[-0.03em]">
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-sm font-medium text-[var(--vms-ink-muted)]">{label}</p>
    </div>
  );
}

function PropertyListItem({
  workspace,
  organizationUseCase,
  selected,
  onSelect,
}: {
  workspace: PropertyWorkspace;
  organizationUseCase?: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const details = propertyDetails(workspace, organizationUseCase);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-[var(--vms-radius-control)] px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
        selected
          ? "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]"
          : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
      )}
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink-muted)]">
        <Building2 className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {workspaceDisplayName(workspace)}
        </span>
        <span className="mt-0.5 block truncate text-[11px] capitalize text-[var(--vms-ink-muted)]">
          {details.kind} · {details.useCase} · {details.address}
        </span>
        <span className="mt-1 flex flex-wrap gap-1">
          {workspace.accesses.map((access) => (
            <span
              key={`${access.area}:${access.roleLabel}`}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[9px] font-semibold",
                roleBadgeClass[access.area],
              )}
            >
              {access.roleLabel}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

function PropertyWorkspaceDetail({
  workspace,
  organizationUseCase,
  onOpen,
}: {
  workspace: PropertyWorkspace;
  organizationUseCase?: string | null;
  onOpen: (workspace: PropertyWorkspace, access: PropertyAccess) => void;
}) {
  const details = propertyDetails(workspace, organizationUseCase);
  const roles = Array.from(
    new Set(
      workspace.accesses.flatMap((access) => access.roleLabel.split(" · ")),
    ),
  );
  const parentPath = workspace.placePath
    .slice(0, -1)
    .map((parent) => parent.name);

  return (
    <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
      <header className="border-b border-[var(--vms-line)] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            {parentPath.length ? (
              <p className="mb-1 text-[11px] font-medium text-[var(--vms-ink-muted)]">
                {parentPath.join(" / ")}
              </p>
            ) : null}
            <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {workspaceDisplayName(workspace)}
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--vms-ink-muted)]">
              <MapPin className="h-4 w-4 shrink-0" />
              {details.address}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
              {details.kind} · {details.useCase}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <UserRound className="h-4 w-4 text-[var(--vms-ink-muted)]" />
          <span className="font-semibold text-[var(--vms-ink)]">Roles:</span>
          <span className="text-[var(--vms-ink-muted)]">
            {roles.join(", ")}
          </span>
        </div>
      </header>

      <div className="p-4 sm:p-5">
        <h3 className="text-lg font-semibold tracking-[-0.02em]">
          Available workspaces
        </h3>
        <div className="mt-3 space-y-2">
          {workspace.accesses.map((access) => (
            <AccessCard
              key={`${access.area}:${access.href}`}
              workspace={workspace}
              access={access}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AccessCard({
  workspace,
  access,
  onOpen,
}: {
  workspace: PropertyWorkspace;
  access: PropertyAccess;
  onOpen: (workspace: PropertyWorkspace, access: PropertyAccess) => void;
}) {
  const Icon = accessIcon[access.area];
  return (
    <ActionCard
      onClick={() => onOpen(workspace, access)}
      title={access.title}
      description={access.description}
      icon={Icon}
      eyebrow={access.area}
      meta={access.roleLabel}
      tone={
        access.area === "management"
          ? "success"
          : access.area === "staff"
            ? "info"
            : access.area === "guest"
              ? "warning"
              : "coral"
      }
      aria-label={`${access.title} — ${access.roleLabel}`}
    />
  );
}

function StatusPanel({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-danger)]"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{detail}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[var(--vms-radius-control)] bg-[var(--vms-danger)] px-3 py-2 font-semibold text-white"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]"
      role="status"
    >
      <span className="sr-only">Loading workspaces</span>
      <div className="h-96 animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
      <div className="h-96 animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
    </div>
  );
}

function propertyDetails(
  workspace: PropertyWorkspace,
  organizationUseCase?: string | null,
) {
  const address =
    [...workspace.placePath].reverse().find((ancestor) => ancestor.address)
      ?.address || "Address not provided";
  const useCase =
    [...workspace.placePath]
      .reverse()
      .find((ancestor) => ancestor.use_case)
      ?.use_case?.replaceAll("_", " ") ||
    organizationUseCase?.replaceAll("_", " ") ||
    "Inherited context";
  return {
    address,
    useCase,
    kind: workspace.place.kind.replaceAll("_", " "),
  };
}

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}
