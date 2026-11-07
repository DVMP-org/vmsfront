"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DoorOpen,
  KeyRound,
  Plus,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { useAdminDashboard } from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";

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
  const data = dashboard.data as CanonicalDashboard | undefined;
  const metrics = data?.metrics;

  if (dashboard.isPending) return <DashboardSkeleton />;
  if (dashboard.isError && !data) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
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

  return (
    <div className="space-y-6 pb-10">
      {dashboard.isError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
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
      )}

      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
            Operations overview ·{" "}
            {context.data?.effective_use_case?.replaceAll("_", " ") ||
              "workspace"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
            Operating dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Property operations, access activity and items that need attention
            across the selected context.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/checkpoints">
              <DoorOpen className="mr-2 h-4 w-4" />
              Open Access
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              New property
            </Link>
          </Button>
        </div>
      </header>

      <section
        aria-label="Operating metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric
          label="Properties"
          value={metrics?.total_places || 0}
          detail="Active property hierarchy"
          icon={Building2}
        />
        <Metric
          label="People"
          value={metrics?.total_parties || 0}
          detail={`${metrics?.active_relationships || 0} active relationships`}
          icon={Users}
        />
        <Metric
          label="Visit access"
          value={metrics?.active_visit_authorizations || 0}
          detail={`${metrics?.pending_visit_authorizations || 0} awaiting approval`}
          icon={KeyRound}
          attention={(metrics?.pending_visit_authorizations || 0) > 0}
        />
        <Metric
          label="On site"
          value={metrics?.active_checkpoint_presences || 0}
          detail={`${metrics?.active_visit_sessions || 0} active visit sessions`}
          icon={Activity}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Properties"
          description="Top-level operating contexts in this organization."
          action={
            <Link
              href="/admin/properties"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
            >
              View directory <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Property</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Context</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.root_places || []).map((place) => (
                  <tr
                    key={place.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/properties/${place.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                      >
                        {place.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {place.address || "No address"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 capitalize text-slate-600 dark:text-slate-300">
                      {place.kind}
                    </td>
                    <td className="px-4 py-3.5 capitalize text-slate-600 dark:text-slate-300">
                      {place.use_case?.replaceAll("_", " ") ||
                        context.data?.effective_use_case?.replaceAll("_", " ") ||
                        "Inherited"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Status tone={place.is_active ? "success" : "muted"}>
                        {place.is_active ? "Active" : "Archived"}
                      </Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.root_places.length && (
              <EmptyRow text="No top-level properties in this context." />
            )}
          </div>
        </Panel>

        <Panel
          title="Needs attention"
          description="Pending approvals and recent access outcomes."
          action={
            <Link
              href="/admin/checkpoints"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
            >
              Access console <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="space-y-2 p-3">
            {(data?.recent_visit_authorizations || [])
              .filter((item) => item.status === "requested")
              .slice(0, 4)
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-900 dark:bg-amber-950/30"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-amber-950 dark:text-amber-100">
                        {item.purpose || "Visitor approval requested"}
                      </p>
                      <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                        {item.host_party?.display_name || "Host"} ·{" "}
                        {item.destination_place?.name ||
                          "Selected destination"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            {!(
              data?.recent_visit_authorizations || []
            ).some((item) => item.status === "requested") && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  No pending visitor approvals
                </p>
              </div>
            )}
            <div className="pt-2">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Recent checkpoints
              </p>
              {(data?.recent_checkpoint_events || [])
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {event.direction === "entry" ? "Check-in" : "Check-out"} ·{" "}
                        {event.outcome}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {event.reason_code.replaceAll("_", " ")}
                      </p>
                    </div>
                    <time className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(event.occurred_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                ))}
              {!data?.recent_checkpoint_events.length && (
                <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
                  No checkpoint activity recorded yet.
                </p>
              )}
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction
          icon={CalendarClock}
          label="Review visit access"
          detail={`${metrics?.pending_visit_authorizations || 0} pending`}
          onClick={() => router.push("/admin/checkpoints")}
        />
        <QuickAction
          icon={CreditCard}
          label="Manage charges"
          detail="Definitions, assignments and schedules"
          onClick={() => router.push("/admin/charges")}
        />
        <QuickAction
          icon={Users}
          label="Manage people"
          detail="Parties and workspace relationships"
          onClick={() => router.push("/admin/admins")}
        />
        <QuickAction
          icon={Activity}
          label="Checkpoint scans today"
          detail={`${metrics?.checkpoint_events_today || 0} recorded`}
          onClick={() => router.push("/admin/checkpoints")}
        />
      </section>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div
          className={
            attention
              ? "grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
              : "grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
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
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-start justify-between gap-4 px-4 py-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Status({
  tone,
  children,
}: {
  tone: "success" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        tone === "success"
          ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }
    >
      {children}
    </span>
  );
}

function QuickAction({
  icon: Icon,
  label,
  detail,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-4 w-4" />
      </div>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
          {detail}
        </span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </button>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
      {text}
    </p>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status">
      <span className="sr-only">Loading dashboard</span>
      <div className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
