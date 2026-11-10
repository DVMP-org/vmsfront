"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  Cable,
  CalendarClock,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { SiteModulesPanel } from "@/features/modules/SiteModulesPanel";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { workspacePermissions } from "@/features/context/api";
import { sitesApi } from "@/features/sites/api";
import { useAppStore } from "@/store/app-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  SiteDetail,
  SiteNotificationSettings,
} from "@/features/sites/api";

export function SiteConfiguration() {
  const [activeTab, setActiveTab] = useState<
    "general" | "gates" | "access" | "roles" | "operations" | "notifications"
  >("general");
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const workspace = useWorkspaceContext();
  const property = useQuery({
    queryKey: ["site-configuration-site", selectedProperty?.id],
    queryFn: () => sitesApi.get(selectedProperty!.id),
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
              <Link href="/admin">Open workspace</Link>
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
  const canManage = workspace.data?.management?.is_administrator === true;
  const canEditModules =
    canManage && workspace.data?.management?.mode === "local";
  const permissions = workspacePermissions(workspace.data);
  const grants = permissions.length ? permissions : canManage ? ["*"] : [];
  const allowed = (permission: string) =>
    grants.some((grant) => {
      if (grant === "*") return true;
      if (grant.endsWith(".*"))
        return permission.startsWith(grant.slice(0, -1));
      return grant === permission;
    });
  const tabs = [
    ["general", "General"],
    ["gates", "Gates & checkpoints"],
    ["access", "Access policies"],
    ["roles", "Roles & permissions"],
    ["operations", "Operational settings"],
    ["notifications", "Notifications"],
  ].filter(([id]) => {
    if (id === "gates") return allowed("gates.list");
    if (id === "access") return allowed("checkpoint_events.list");
    if (id === "roles") return allowed("parties.update");
    if (id === "operations") return allowed("places.update");
    if (id === "notifications") return allowed("places.update");
    return true;
  }) as Array<
    [
      "general" | "gates" | "access" | "roles" | "operations" | "notifications",
      string,
    ]
  >;

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
      </header>


      <nav
        aria-label="Site configuration sections"
        className="-mx-1 overflow-x-auto border-b border-[var(--vms-line)]"
      >
        <div className="flex min-w-max gap-1 px-1">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-current={activeTab === id ? "page" : undefined}
              onClick={() => setActiveTab(id)}
              className={[
                "relative min-h-11 px-3 text-sm font-semibold",
                activeTab === id
                  ? "text-[var(--vms-ink)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-[var(--vms-active-accent)]"
                  : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "general" ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
          <h2 className="text-lg font-semibold">General details</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--vms-ink-muted)]">Name</dt>
              <dd className="mt-1 font-semibold">{property.data.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--vms-ink-muted)]">Address</dt>
              <dd className="mt-1 font-semibold">
                {property.data.address || "No address recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--vms-ink-muted)]">Hierarchy</dt>
              <dd className="mt-1 font-semibold">
                {property.data.parent_site_id ? "Child Site" : "Root Site"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--vms-ink-muted)]">
                Operating context
              </dt>
              <dd className="mt-1 font-semibold capitalize">
                {(
                  property.data.use_case ??
                  workspace.data?.effective_use_case ??
                  ""
                )
                  .toString()
                  .replaceAll("_", " ")}
              </dd>
            </div>
          </dl>
          <Button className="mt-5" variant="outline" asChild>
            <Link href="/admin/site/configuration">Edit property details</Link>
          </Button>
        </section>
      ) : null}

      {activeTab === "gates" ? (
        <ConfigurationLinkCard
          icon={ShieldCheck}
          title="Gates & checkpoints"
          description="Create checkpoints, configure each gate's parent dependency, assign operators and inspect the dependency map."
          href="/admin/gates"
          action="Open Gates Management"
        />
      ) : null}

      {activeTab === "access" ? (
        <ConfigurationLinkCard
          icon={CalendarClock}
          title="Access policies"
          description="Gate direction, schedules, credential types, re-entry and offline behavior are configured on each checkpoint. Passage decisions remain server-owned."
          href="/admin/gates"
          action="Configure checkpoint policies"
        />
      ) : null}

      {activeTab === "roles" ? (
        <ConfigurationLinkCard
          icon={Users}
          title="Roles & permissions"
          description="Manage site administrators and their effective role grants. Administrator authority remains scoped to this site."
          href="/admin/managers"
          action="Manage site administrators"
        />
      ) : null}

      {activeTab === "operations" ? (
        <SiteModulesPanel
          siteId={property.data.id}
          siteName={property.data.name}
          canEdit={canEditModules}
        />
      ) : null}

      {activeTab === "notifications" ? (
        <NotificationSettingsPanel
          property={property.data}
          canEdit={canEditModules}
        />
      ) : null}
    </main>
  );
}

const notificationOptions: Array<{
  key: keyof SiteNotificationSettings;
  label: string;
  description: string;
}> = [
  {
    key: "maintenance_updates",
    label: "Maintenance updates",
    description: "Assignment, scheduling, resolution and closure changes.",
  },
  {
    key: "resident_announcements",
    label: "Resident announcements",
    description: "Publication of Site notices and resident communication.",
  },
  {
    key: "emergency_alerts",
    label: "Emergency alerts",
    description: "Incident triggers, acknowledgements and resolutions.",
  },
  {
    key: "visitor_arrivals",
    label: "Visitor arrivals",
    description: "Invitation approvals and checkpoint arrival events.",
  },
  {
    key: "weekly_operations_summary",
    label: "Weekly operations summary",
    description: "A weekly digest of unresolved work and operating activity.",
  },
];

function NotificationSettingsPanel({
  property,
  canEdit,
}: {
  property: SiteDetail;
  canEdit: boolean;
}) {
  const client = useQueryClient();
  const [values, setValues] = useState<SiteNotificationSettings>(
    property.notification_settings,
  );
  const save = useMutation({
    mutationFn: () =>
      sitesApi.update(property.id, { notification_settings: values }),
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ["site-configuration-site", property.id],
      });
    },
  });

  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
      <Bell className="h-6 w-6" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold">Site notifications</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
        Choose which Site operations can produce communication for its
        administrators and residents. Organization-wide integration delivery
        remains controlled from Organization settings.
      </p>
      <div className="mt-5 divide-y divide-[var(--vms-line)] rounded-[var(--vms-radius-control)] border border-[var(--vms-line)]">
        {notificationOptions.map((option) => (
          <label
            key={option.key}
            className="flex cursor-pointer items-start gap-3 p-4"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={values[option.key]}
              disabled={!canEdit || save.isPending}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [option.key]: event.target.checked,
                }))
              }
            />
            <span>
              <span className="block text-sm font-semibold">
                {option.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[var(--vms-ink-muted)]">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
      {save.isError ? (
        <p role="alert" className="mt-4 text-sm text-[var(--vms-danger)]">
          Notification preferences could not be saved. Try again.
        </p>
      ) : save.isSuccess ? (
        <p role="status" className="mt-4 text-sm text-[var(--vms-success)]">
          Notification preferences saved.
        </p>
      ) : null}
      <Button
        className="mt-5"
        disabled={!canEdit}
        isLoading={save.isPending}
        onClick={() => save.mutate()}
      >
        Save notification preferences
      </Button>
    </section>
  );
}

function ConfigurationLinkCard({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
      <Icon className="h-6 w-6" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
      >
        {action}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
