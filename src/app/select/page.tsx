"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
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
import { Header } from "@/components/layout/Header";
import {
  buildPropertyWorkspaces,
  type PropertyAccess,
  type PropertyWorkspace,
  type WorkspaceArea,
} from "@/features/workspaces/catalog";
import { propertiesApi } from "@/features/properties/api";
import { useAdminProfile } from "@/hooks/use-admin";
import { useVerifyToken } from "@/hooks/use-auth";
import { useRequireEmailVerification } from "@/hooks/use-email-verification-guard";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const accessIcon = {
  management: ShieldCheck,
  occupancy: Home,
  staff: BriefcaseBusiness,
  guest: ConciergeBell,
};

const roleBadgeClass: Record<WorkspaceArea, string> = {
  management:
    "bg-[rgb(var(--workspace-accent,33_57_10)/0.08)] text-[rgb(var(--workspace-accent,33_57_10))] dark:bg-emerald-950/40 dark:text-emerald-200",
  occupancy:
    "bg-[rgb(var(--workspace-accent,33_57_10)/0.08)] text-[rgb(var(--workspace-accent,33_57_10))] dark:bg-emerald-950/40 dark:text-emerald-200",
  staff: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200",
  guest: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
};

export default function SelectPage() {
  const router = useRouter();
  const organization = useAppStore((state) => state.organization);
  const setSelectedProperty = useAppStore((state) => state.setSelectedProperty);
  const context = useVerifyToken();
  const admin = useAdminProfile();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  useRequireEmailVerification(true);

  const adminProfile = admin.isError ? null : admin.data;
  const managedPlaces = useQuery({
    queryKey: ["workspace-managed-places", organization?.id],
    queryFn: () =>
      propertiesApi.list({
        page: 1,
        page_size: 100,
        is_active: true,
      }),
    enabled: !!organization?.id && !!adminProfile,
    retry: false,
  });

  const loading =
    context.isPending ||
    admin.isPending ||
    (!!adminProfile && managedPlaces.isPending);
  const workspaces = buildPropertyWorkspaces({
    admin: adminProfile,
    relationships: context.data?.workspaces || [],
    managedPlaces: managedPlaces.data?.items || [],
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
      name: workspace.place.name,
    });
    router.push(access.href);
  }

  return (
    <div className="workspace-switcher min-h-screen bg-zinc-50 text-zinc-900 dark:bg-background dark:text-zinc-50">
      <Header type="select" />
      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--workspace-accent,33_57_10))] dark:text-emerald-300">
            <Building2 className="h-4 w-4" />
            {organization?.name || "Organization"}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            Workspace access
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-200 text-[11px] font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {initials(userName)}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {userName}
            </span>
            <span className="hidden h-5 w-px bg-zinc-300 dark:bg-zinc-700 sm:block" />
            <span>
              Role:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {managementRole ||
                  adminProfile?.role?.name ||
                  "Organization member"}
              </span>
            </span>
            <span className="hidden h-5 w-px bg-zinc-300 dark:bg-zinc-700 sm:block" />
            <span>
              Organization:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {organization?.name || "Current organization"}
              </span>
            </span>
          </div>
        </header>

        <section
          aria-label="Workspace summary"
          className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Metric
            icon={Building2}
            label="Properties"
            value={workspaces.length}
          />
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
          <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Building2 className="mx-auto h-10 w-10 text-zinc-400" />
            <h2 className="mt-4 text-lg font-semibold">No workspace access</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Your account has no active management, residency, tenancy, staff
              or guest role in this organization.
            </p>
          </section>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
                <h2 className="text-base font-semibold tracking-[-0.02em]">
                  Properties ({workspaces.length})
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <p>
            Management rights do not create resident, tenant or guest
            membership.
          </p>
          <Link
            href="/organizations"
            className="font-semibold text-[rgb(var(--workspace-accent,33_57_10))] hover:underline dark:text-emerald-300"
          >
            Switch organization
          </Link>
        </footer>
      </main>
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
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-2xl font-semibold tabular-nums tracking-[-0.03em]">
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </p>
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
        "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--workspace-accent,33_57_10)/0.35)]",
        selected
          ? "bg-[rgb(var(--workspace-accent,33_57_10)/0.08)] text-zinc-950 dark:bg-emerald-950/30 dark:text-white"
          : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/70",
      )}
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-zinc-600 shadow-sm dark:bg-zinc-900 dark:text-zinc-300">
        <Building2 className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {workspace.place.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] capitalize text-zinc-500 dark:text-zinc-400">
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
    <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-zinc-100 p-5 dark:border-zinc-800 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            {parentPath.length ? (
              <p className="mb-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {parentPath.join(" / ")}
              </p>
            ) : null}
            <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {workspace.place.name}
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <MapPin className="h-4 w-4 shrink-0" />
              {details.address}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.1em] text-zinc-400">
              {details.kind} · {details.useCase}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <UserRound className="h-4 w-4 text-zinc-400" />
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
            Roles:
          </span>
          <span className="text-zinc-600 dark:text-zinc-300">
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
    <button
      type="button"
      onClick={() => onOpen(workspace, access)}
      className="group flex w-full items-start gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50/70 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--workspace-accent,33_57_10)/0.35)] dark:border-zinc-700/80 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/70"
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
          access.area === "management" || access.area === "occupancy"
            ? "bg-[rgb(var(--workspace-accent,33_57_10)/0.08)] text-[rgb(var(--workspace-accent,33_57_10))] dark:bg-emerald-950/40 dark:text-emerald-200"
            : access.area === "staff"
              ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200"
              : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{access.title}</span>
        <span className="mt-1 block text-sm leading-5 text-zinc-500 dark:text-zinc-400">
          {access.description}
        </span>
        <span className="mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          <UserRound className="h-3.5 w-3.5" />
          {access.roleLabel}
        </span>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[rgb(var(--workspace-accent,33_57_10))] transition-transform group-hover:translate-x-1 dark:text-emerald-300" />
    </button>
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
      className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{detail}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 font-semibold text-white"
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
      <div className="h-96 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
      <div className="h-96 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
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
