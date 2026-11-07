"use client";

import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Clock3,
  DoorOpen,
  ListChecks,
  RefreshCw,
} from "lucide-react";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { useAdminDashboard } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { AdminDashboard } from "@/types";

export function RecentContextBar() {
  const organization = useAppStore((state) => state.organization);
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const workspace = useWorkspaceContext();
  const contextLabel = selectedProperty
    ? "Property context"
    : "Organization overview";
  const contextName =
    selectedProperty?.name || organization?.name || "Workspace";
  const useCase =
    workspace.data?.effective_use_case?.replaceAll("_", " ") || "Loading";
  const canViewWorkQueue =
    workspace.data?.modules.includes("check_in_out") || false;

  return (
    <section
      aria-label="Recent workspace context"
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgb(var(--brand-primary,#213928)/0.08)] text-[rgb(var(--brand-primary,#213928))] dark:bg-emerald-950/40 dark:text-emerald-200">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            {contextLabel}
          </p>
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {contextName}
            <span className="ml-2 text-xs font-medium capitalize text-zinc-500 dark:text-zinc-400">
              {useCase}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        {canViewWorkQueue ? <WorkQueueSummary /> : null}
        <Link
          href="/select"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-2 font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Switch workspace
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

function WorkQueueSummary() {
  const dashboard = useAdminDashboard();
  const data = dashboard.data as AdminDashboard | undefined;
  const metrics = data?.metrics;
  const recentEvent = data?.recent_checkpoint_events?.[0];

  if (dashboard.isError) {
    return (
      <button
        type="button"
        onClick={() => dashboard.refetch()}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Work queue unavailable
      </button>
    );
  }

  return (
    <>
      <ContextMetric
        href="/admin/checkpoints"
        icon={ListChecks}
        label="Awaiting approval"
        value={metrics?.pending_visit_authorizations}
        attention={(metrics?.pending_visit_authorizations || 0) > 0}
      />
      <ContextMetric
        href="/admin/checkpoints"
        icon={DoorOpen}
        label="On site"
        value={metrics?.active_visit_sessions}
      />
      {recentEvent ? (
        <Link
          href="/admin/checkpoints"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <Clock3 className="h-3.5 w-3.5" />
          <span>
            Recent {formatActivity(recentEvent.direction, recentEvent.outcome)}
            <span className="ml-1 text-zinc-400 dark:text-zinc-500">
              {relativeTime(recentEvent.occurred_at)}
            </span>
          </span>
        </Link>
      ) : null}
    </>
  );
}

function ContextMetric({
  href,
  icon: Icon,
  label,
  value,
  attention = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  attention?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 transition",
        attention
          ? "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span className="font-semibold tabular-nums">{value ?? "–"}</span>
    </Link>
  );
}

function formatActivity(direction: string, outcome: string) {
  const movement = direction === "entry" ? "entry" : "exit";
  return `${movement} ${outcome.toLowerCase()}`;
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}
