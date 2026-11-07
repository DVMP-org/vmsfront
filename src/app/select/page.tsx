"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ConciergeBell,
  Home,
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

const accessBadgeClass: Record<WorkspaceArea, string> = {
  management:
    "border-[rgb(var(--workspace-accent,33_57_10)/0.2)] bg-[rgb(var(--workspace-accent,33_57_10)/0.08)] text-[rgb(var(--workspace-accent,33_57_10))] dark:border-[rgb(var(--workspace-accent,33_57_10)/0.35)] dark:bg-[rgb(var(--workspace-accent,33_57_10)/0.16)] dark:text-white",
  occupancy:
    "border-[rgb(var(--workspace-accent,33_57_10)/0.18)] bg-[rgb(var(--workspace-accent,33_57_10)/0.08)] text-[rgb(var(--workspace-accent,33_57_10))] dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  staff:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  guest:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
};

export default function SelectPage() {
  const router = useRouter();
  const organization = useAppStore((state) => state.organization);
  const setSelectedProperty = useAppStore((state) => state.setSelectedProperty);
  const context = useVerifyToken();
  const admin = useAdminProfile();
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
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-6 flex flex-col gap-5 border-b border-zinc-200 pb-7 dark:border-zinc-800 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--workspace-accent,33_57_10))] dark:text-emerald-300">
              <Building2 className="h-4 w-4" />
              {organization?.name || "Organization"}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Your workspaces
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Choose the property and access you need. Administration stays
              separate from personal residency, tenancy, staff and guest access.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[rgb(var(--workspace-accent,33_57_10)/0.08)] text-[rgb(var(--workspace-accent,33_57_10))] dark:bg-emerald-950/40 dark:text-emerald-200">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Signed in as
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {context.data?.user.name ||
                  context.data?.user.email ||
                  "Current user"}
              </p>
            </div>
          </div>
        </header>

        <section
          aria-label="Workspace summary"
          className="mb-7 grid divide-y overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          <SummaryItem
            label="Properties"
            value={String(workspaces.length)}
            detail={`${accessCount} active ${accessCount === 1 ? "access" : "accesses"}`}
          />
          <SummaryItem
            label="Management"
            value={
              managedPropertyCount
                ? String(managedPropertyCount)
                : adminProfile
                  ? "Restricted"
                  : "None"
            }
            detail={
              managedPropertyCount
                ? `${adminProfile?.role?.name || "Administrator"} access`
                : "No property management role"
            }
          />
          <SummaryItem
            label="Personal access"
            value={String(personalAccessCount)}
            detail="Occupancy, staff and guest roles"
          />
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
          <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Building2 className="mx-auto h-10 w-10 text-zinc-400" />
            <h2 className="mt-4 text-lg font-semibold">No workspace access</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Your account has no active management, residency, tenancy, staff
              or guest role in this organization.
            </p>
          </section>
        ) : (
          <section aria-labelledby="property-workspaces">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2
                  id="property-workspaces"
                  className="text-lg font-semibold tracking-[-0.02em]"
                >
                  Properties
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Each card contains only the workspaces you can access there.
                </p>
              </div>
              <span className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {workspaces.length}
              </span>
            </div>
            <div className="grid gap-4">
              {workspaces.map((workspace) => (
                <PropertyWorkspaceCard
                  key={workspace.key}
                  workspace={workspace}
                  organizationUseCase={organization?.use_case}
                  onOpen={openAccess}
                />
              ))}
            </div>
          </section>
        )}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
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

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="p-4 sm:p-5">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
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

function PropertyWorkspaceCard({
  workspace,
  organizationUseCase,
  onOpen,
}: {
  workspace: PropertyWorkspace;
  organizationUseCase?: string | null;
  onOpen: (workspace: PropertyWorkspace, access: PropertyAccess) => void;
}) {
  const place = workspace.place;
  const managementAccess = workspace.accesses.find(
    (access) => access.area === "management",
  );
  const personalAccesses = workspace.accesses.filter(
    (access) => access.area !== "management",
  );
  const parentPath = workspace.placePath
    .slice(0, -1)
    .map((parent) => parent.name);
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

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {formatLabel(place.kind)}
              </span>
              {managementAccess ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[rgb(var(--workspace-accent,33_57_10))] px-2 py-1 text-[10px] font-semibold text-white">
                  <ShieldCheck className="h-3 w-3" />
                  Managed property
                </span>
              ) : null}
            </div>
            {parentPath.length ? (
              <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {parentPath.join(" / ")}
              </p>
            ) : null}
            <h3 className="mt-3 truncate text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
              {place.name}
            </h3>
            <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
              <p className="flex min-w-0 items-start gap-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{address}</span>
              </p>
              <p className="flex items-center gap-1.5 capitalize">
                <Building2 className="h-4 w-4 shrink-0" />
                {useCase}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 lg:max-w-xs lg:justify-end">
            {workspace.accesses.map((access) => (
              <span
                key={`${access.area}:${access.roleLabel}`}
                className={cn(
                  "rounded-md border px-2 py-1 text-[10px] font-semibold",
                  accessBadgeClass[access.area],
                )}
              >
                {access.roleLabel}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div
        className={cn(
          "grid gap-px border-t border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800",
          managementAccess && personalAccesses.length
            ? "lg:grid-cols-2"
            : "grid-cols-1",
        )}
      >
        {managementAccess ? (
          <AccessButton
            access={managementAccess}
            workspace={workspace}
            onOpen={onOpen}
          />
        ) : null}
        {personalAccesses.length ? (
          <div className="grid gap-px bg-zinc-200 dark:bg-zinc-800">
            {personalAccesses.map((access) => (
              <AccessButton
                key={`${access.area}:${access.href}`}
                access={access}
                workspace={workspace}
                onOpen={onOpen}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function AccessButton({
  workspace,
  access,
  onOpen,
}: {
  workspace: PropertyWorkspace;
  access: PropertyAccess;
  onOpen: (workspace: PropertyWorkspace, access: PropertyAccess) => void;
}) {
  const Icon = accessIcon[access.area];
  const management = access.area === "management";

  return (
    <button
      type="button"
      onClick={() => onOpen(workspace, access)}
      className={cn(
        "group flex min-h-28 items-start gap-3 p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--workspace-accent,33_57_10))]",
        management
          ? "bg-[rgb(var(--workspace-accent,33_57_10))] text-white hover:bg-[rgb(var(--workspace-accent,33_57_10)/0.9)]"
          : access.area === "guest"
            ? "bg-amber-50/60 text-zinc-900 hover:bg-amber-50 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            : "bg-white text-zinc-900 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
          management
            ? "bg-white/10 text-emerald-200"
            : access.area === "staff"
              ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200"
              : access.area === "guest"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                : "bg-[rgb(var(--workspace-accent,33_57_10)/0.08)] text-[rgb(var(--workspace-accent,33_57_10))] dark:bg-emerald-950/40 dark:text-emerald-200",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {access.title}
          <ArrowRight className="h-3.5 w-3.5 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
        </span>
        <span
          className={cn(
            "mt-1 block text-xs leading-5",
            management ? "text-white/75" : "text-zinc-500 dark:text-zinc-400",
          )}
        >
          {access.description}
        </span>
        <span
          className={cn(
            "mt-2 block text-[11px] font-semibold",
            management
              ? "text-emerald-200"
              : "text-zinc-700 dark:text-zinc-300",
          )}
        >
          {access.roleLabel}
        </span>
      </span>
      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
    </button>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="grid gap-4" role="status">
      <span className="sr-only">Loading workspaces</span>
      <div className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-64 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}
