"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  ListChecks,
  Plus,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FirstWorkspaceSetup } from "@/components/onboarding/FirstWorkspaceSetup";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { useAdminDashboard } from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";

interface CanonicalDashboard {
  metrics: {
    total_places: number;
    total_parties: number;
    active_relationships: number;
    active_visit_authorizations: number;
    pending_visit_authorizations: number;
    active_visit_sessions: number;
    active_checkpoint_presences: number;
    checkpoint_events_today: number;
  };
  root_places: Array<{
    id: string;
    name: string;
    kind: string;
    address: string;
    is_active: boolean;
    use_case: string | null;
  }>;
  recent_visit_authorizations: Array<{
    id: string;
    code: string;
    status: string;
    purpose: string | null;
    valid_from: string;
    valid_to: string;
    uses_count: number;
    max_uses: number | null;
    host_party?: { display_name?: string } | null;
    destination_place?: { name?: string } | null;
  }>;
  recent_checkpoint_events: Array<{
    id: string;
    direction: string;
    outcome: string;
    reason_code: string;
    occurred_at: string;
    place_id: string;
    gate_id: string;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const dashboard = useAdminDashboard();
  const context = useWorkspaceContext();
  const organization = useAppStore((state) => state.organization);
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const data = dashboard.data as CanonicalDashboard | undefined;
  const metrics = data?.metrics;
  const [showFirstWorkspaceSetup, setShowFirstWorkspaceSetup] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested =
      params.get("setup") === "first-workspace" ||
      window.sessionStorage.getItem("organization-setup-step") ===
        "first-workspace";
    if (requested) setShowFirstWorkspaceSetup(true);
  }, []);

  useEffect(() => {
    if (!data) return;
    if (!data.root_places.length) {
      router.replace("/admin/properties/new?setup=first-place");
    } else if (!selectedProperty) {
      router.replace("/admin/properties");
    }
  }, [data, router, selectedProperty]);

  if (dashboard.isPending) return <DashboardSkeleton />;
  if (dashboard.isError && !data) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      >
        <p className="font-semibold">Dashboard unavailable</p>
        <p className="mt-1">{parseApiError(dashboard.error).message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => dashboard.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }
  if (!data?.root_places.length || !selectedProperty) {
    return (
      <p role="status" className="text-sm text-slate-600">
        Opening property setup…
      </p>
    );
  }
  if (!context.data?.management?.is_administrator) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"
      >
        <p className="font-semibold">Property management access required</p>
        <p className="mt-1">
          The management dashboard belongs to a property. Select a property you
          administer or create the first property for this organization.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/admin/properties">Open Properties</Link>
        </Button>
      </div>
    );
  }

  const pending = data?.recent_visit_authorizations.filter(
    (item) => item.status === "requested",
  );
  const latestEvent = data?.recent_checkpoint_events[0];
  const useCase =
    context.data?.effective_use_case?.replaceAll("_", " ") ||
    organization?.use_case?.replaceAll("_", " ") ||
    "operations";

  return (
    <div className="space-y-4 pb-8 text-[#0f1b31]">
      {dashboard.isError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <span>Showing the last successful snapshot. Refresh failed.</span>
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => dashboard.refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      <header className="border-b border-[#dce3ee] pb-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
          <Building2 className="h-3.5 w-3.5 text-[#2563eb]" />
          <span>{organization?.name || "Organization"}</span>
          <span className="text-[#c3cad6]">/</span>
          <span>{selectedProperty?.name || "All properties"}</span>
          <span className="rounded bg-[#eaf1ff] px-2 py-0.5 font-semibold capitalize text-[#1d4ed8]">
            {useCase}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em] sm:text-[36px]">
              Management overview
            </h1>
            <p className="mt-1 text-sm text-[#667085]">
              Prioritise exceptions, stay oriented across the portfolio, and
              move into the right operating workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden items-center gap-2 text-xs text-[#667085] sm:flex">
              <CalendarDays className="h-3.5 w-3.5" />
              Updated{" "}
              {new Date().toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/invitations">
                <ListChecks className="mr-2 h-4 w-4" />
                Open work queue
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                New property
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {showFirstWorkspaceSetup ? (
        <FirstWorkspaceSetup
          rootPlaceCount={data?.root_places.length || 0}
          onOpenProperties={() => {
            window.sessionStorage.removeItem("organization-setup-step");
            setShowFirstWorkspaceSetup(false);
            router.push(
              data?.root_places.length
                ? "/admin/properties"
                : "/admin/properties/new",
            );
          }}
          onDismiss={() => {
            window.sessionStorage.removeItem("organization-setup-step");
            setShowFirstWorkspaceSetup(false);
          }}
        />
      ) : null}

      <section
        aria-label="Operating metrics"
        className="grid overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)] sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric
          label="Active properties"
          value={metrics?.total_places || 0}
          detail={`${data?.root_places.length || 0} portfolio roots`}
          icon={Building2}
        />
        <Metric
          label="People"
          value={metrics?.total_parties || 0}
          detail={`${metrics?.active_relationships || 0} active relationships`}
          icon={Users}
        />
        <Metric
          label="Awaiting access"
          value={metrics?.pending_visit_authorizations || 0}
          detail={`${metrics?.active_visit_authorizations || 0} currently valid`}
          icon={DoorOpen}
          attention={(metrics?.pending_visit_authorizations || 0) > 0}
        />
        <Metric
          label="On site"
          value={metrics?.active_checkpoint_presences || 0}
          detail={`${metrics?.checkpoint_events_today || 0} checkpoint events today`}
          icon={Clock3}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.75fr)]">
        <Panel
          title="Work queue"
          description="Resolve consequential exceptions before routine work."
          action={
            <Link
              href="/admin/invitations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:underline"
            >
              Review all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="divide-y divide-[#edf0f5]">
            {pending?.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href="/admin/invitations"
                className="grid gap-3 px-4 py-3 transition hover:bg-[#f8faff] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-semibold">
                      {item.purpose || "Visitor approval requested"}
                    </strong>
                    <span className="mt-0.5 block truncate text-xs text-[#667085]">
                      {item.host_party?.display_name || "Host"} ·{" "}
                      {item.destination_place?.name || "Selected property"}
                    </span>
                  </span>
                </div>
                <span className="justify-self-start rounded bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700 sm:justify-self-end">
                  Review
                </span>
              </Link>
            ))}
            {!pending?.length ? (
              <div className="flex items-center gap-3 px-4 py-5 text-sm text-[#475467]">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                No visitor approvals need attention.
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
              <span className="flex items-center gap-2 text-[#667085]">
                <Clock3 className="h-3.5 w-3.5" />
                Latest activity
              </span>
              <span className="text-right font-medium text-[#344054]">
                {latestEvent
                  ? `${formatMovement(latestEvent.direction)} ${latestEvent.outcome.toLowerCase()} · ${relativeTime(latestEvent.occurred_at)}`
                  : "No checkpoint activity yet"}
              </span>
            </div>
          </div>
        </Panel>

        <section className="overflow-hidden rounded-lg border border-[#cddbf5] bg-[#f1f6ff]">
          <div className="border-b border-[#d6e2f8] px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563eb]">
              Today&apos;s focus
            </p>
            <h2 className="mt-1 text-base font-semibold">Keep the day moving</h2>
          </div>
          <div className="space-y-3 p-4">
            <FocusItem
              href="/admin/invitations"
              title={`${metrics?.pending_visit_authorizations || 0} access reviews`}
              detail="Clear approvals before they become gate exceptions."
            />
            <FocusItem
              href="/admin/people"
              title={`${metrics?.active_relationships || 0} active relationships`}
              detail="Confirm property teams and occupants are assigned."
            />
            <FocusItem
              href="/admin/charges"
              title="Review charges"
              detail="Check property responsibility, schedules and balances."
            />
            <Link
              href="/select"
              className="mt-1 flex items-center justify-between rounded-md bg-white px-3 py-2.5 text-xs font-semibold text-[#1d4ed8] ring-1 ring-[#d6e2f8] transition hover:ring-[#9db7ee]"
            >
              Switch role or workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </section>

      <Panel
        title="Property operations"
        description="Select a property to narrow management scope without leaving the portfolio."
        action={
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:underline"
          >
            Manage properties <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-y border-[#dce3ee] bg-[#f8faff] text-[10px] uppercase tracking-[0.1em] text-[#667085]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Property</th>
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Operating context</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold">Open</th>
              </tr>
            </thead>
            <tbody>
              {(data?.root_places || []).map((place) => (
                <tr
                  key={place.id}
                  className="border-b border-[#edf0f5] last:border-0 hover:bg-[#f8faff]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/properties/${place.id}`}
                      className="font-semibold text-[#0f1b31] hover:text-[#2563eb]"
                    >
                      {place.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-[#98a2b3]">
                      {place.address || "No address"}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize text-[#475467]">
                    {place.kind}
                  </td>
                  <td className="px-4 py-3 capitalize text-[#475467]">
                    {place.use_case?.replaceAll("_", " ") || useCase}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        place.is_active
                          ? "rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                          : "rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"
                      }
                    >
                      {place.is_active ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/properties/${place.id}`}
                      aria-label={`Open ${place.name}`}
                      className="inline-grid h-8 w-8 place-items-center rounded-md text-[#667085] transition hover:bg-white hover:text-[#2563eb] hover:ring-1 hover:ring-[#dce3ee]"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.root_places.length ? (
            <EmptyRow text="No top-level properties in this organization." />
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  attention = false,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  attention?: boolean;
}) {
  return (
    <div className="border-b border-[#edf0f5] px-4 py-4 last:border-b-0 sm:[&:nth-child(-n+2)]:border-b xl:border-b-0 xl:border-r xl:last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#667085]">{label}</p>
          <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em]">
            {value}
          </p>
        </div>
        <span
          className={
            attention
              ? "grid h-8 w-8 place-items-center rounded-md bg-amber-50 text-amber-700"
              : "grid h-8 w-8 place-items-center rounded-md bg-[#f1f6ff] text-[#2563eb]"
          }
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-[#98a2b3]">{detail}</p>
    </div>
  );
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
      <header className="flex items-start justify-between gap-4 px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-[#667085]">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function FocusItem({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-md px-1 py-1.5"
    >
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]" />
      <span>
        <strong className="block text-sm font-semibold text-[#0f1b31] group-hover:text-[#2563eb]">
          {title}
        </strong>
        <span className="mt-0.5 block text-[11px] leading-4 text-[#667085]">
          {detail}
        </span>
      </span>
    </Link>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-[#667085]">{text}</p>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" role="status">
      <span className="sr-only">Loading dashboard</span>
      <div className="h-24 animate-pulse rounded-lg bg-[#e8edf5]" />
      <div className="h-28 animate-pulse rounded-lg bg-[#e8edf5]" />
      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.75fr]">
        <div className="h-72 animate-pulse rounded-lg bg-[#e8edf5]" />
        <div className="h-72 animate-pulse rounded-lg bg-[#e8edf5]" />
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-[#e8edf5]" />
    </div>
  );
}

function formatMovement(direction: string) {
  return direction === "entry" ? "Check-in" : "Check-out";
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "just now";
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}
