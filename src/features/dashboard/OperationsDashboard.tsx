"use client";

import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Clock3,
  DoorOpen,
  ListChecks,
  RefreshCcw,
  ShieldAlert,
  Users,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/datetime";
import type {
  AdminDashboard,
  AnalyticsSummary,
  OperationsAttention,
} from "@/types";
import { AccessTrendPanel, type DashboardRange } from "./AccessTrendPanel";
import { AttentionQueue } from "./AttentionQueue";
import {
  MetricStrip,
  PanelState,
  ReportPanel,
  SeeAllLink,
  StaleDataBanner,
} from "./DashboardPrimitives";

function movementLabel(direction: string) {
  if (direction === "entry") return "Entry";
  if (direction === "exit") return "Exit";
  return direction.replaceAll("_", " ");
}

function outcomeVariant(outcome: string) {
  if (outcome === "allowed" || outcome === "completed")
    return "success" as const;
  if (outcome === "denied" || outcome === "failed") return "danger" as const;
  return "warning" as const;
}

function humanize(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not recorded";
}

export function OperationsDashboard({
  data,
  analytics,
  analyticsPending,
  analyticsError,
  analyticsFetching,
  attention,
  attentionPending,
  attentionError,
  attentionFetching,
  onRetryAttention,
  range,
  onRangeChange,
  onRetryAnalytics,
  isStale,
  isFetching,
  onRetryDashboard,
  propertyName,
  organizationName,
  useCase,
  updatedAt,
  setupPanel,
}: {
  data: AdminDashboard;
  analytics?: AnalyticsSummary;
  analyticsPending: boolean;
  analyticsError: boolean;
  analyticsFetching: boolean;
  attention?: OperationsAttention;
  attentionPending: boolean;
  attentionError: boolean;
  attentionFetching: boolean;
  onRetryAttention: () => void;
  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
  onRetryAnalytics: () => void;
  isStale: boolean;
  isFetching: boolean;
  onRetryDashboard: () => void;
  propertyName: string;
  organizationName: string;
  useCase: string;
  updatedAt?: number;
  setupPanel?: React.ReactNode;
}) {
  const metrics = data.metrics;
  const activeProperties = data.root_places.filter((place) => place.is_active);

  return (
    <div className="space-y-4 pb-10 text-[var(--vms-ink)]">
      {isStale ? (
        <StaleDataBanner
          message="The latest dashboard snapshot could not be loaded. The last successful results remain visible."
          onRetry={onRetryDashboard}
          isRetrying={isFetching}
        />
      ) : null}

      <header className="border-b border-[var(--vms-line)] pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
          <Building2 className="h-3.5 w-3.5" aria-hidden />
          <span>{organizationName}</span>
          <span aria-hidden>/</span>
          <span>{propertyName}</span>
          <Badge variant="neutral" className="capitalize">
            {useCase}
          </Badge>
        </div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
              Operations Hub
            </p>
            <h1 className="mt-1 text-2xl font-semibold leading-8 tracking-[-0.03em] sm:text-[28px] sm:leading-9">
              Property operations
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
              Prioritize access exceptions, monitor movement and keep the
              selected property operating from one current view.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/admin/invitations">
                <ListChecks className="h-4 w-4" aria-hidden />
                Work queue
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/checkpoints/console">
                <Building2 className="h-4 w-4" aria-hidden />
                Open check-in console
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {setupPanel}

      <section
        aria-label="Dashboard filters"
        className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold text-[var(--vms-ink-muted)] sm:max-w-56">
          Property
          <span className="flex min-h-10 items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 text-sm font-medium text-[var(--vms-ink)]">
            {propertyName}
          </span>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-[var(--vms-ink-muted)]">
          Reporting period
          <select
            value={range}
            onChange={(event) =>
              onRangeChange(Number(event.target.value) as DashboardRange)
            }
            className="min-h-10 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-sm font-medium text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </label>
        <div className="flex min-h-10 items-center gap-2 text-xs text-[var(--vms-ink-muted)] sm:ml-auto">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          <span>
            {updatedAt
              ? `Updated ${new Date(updatedAt).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Not refreshed yet"}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh dashboard"
            onClick={onRetryDashboard}
            isLoading={isFetching}
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </section>

      <MetricStrip
        metrics={[
          {
            label: "Active properties",
            value: activeProperties.length,
            detail: `${data.root_places.length} portfolio roots`,
            icon: Building2,
            tone: "coral",
          },
          {
            label: "People",
            value: metrics.total_parties,
            detail: `${metrics.active_relationships} active relationships`,
            icon: Users,
            tone: "ink",
          },
          {
            label: "Pending approvals",
            value: metrics.pending_visit_authorizations,
            detail: `${metrics.active_visit_authorizations} valid invitations`,
            icon: ShieldAlert,
            attention: metrics.pending_visit_authorizations > 0,
            tone: "warning",
            href: "/admin/invitations",
          },
          {
            label: "On site",
            value: metrics.active_checkpoint_presences,
            detail: `${metrics.active_visit_sessions} active visit sessions`,
            icon: UsersRound,
            tone: "success",
            href: "/admin/checkpoints",
          },
          {
            label: "Recent entries",
            value: countDirection(data, "entry"),
            detail: `${countDirection(data, "exit")} exits in the recent feed`,
            icon: DoorOpen,
            tone: "info",
            href: "/admin/checkpoints",
          },
          {
            label: "Checkpoint events",
            value: metrics.checkpoint_events_today,
            detail: "Recorded today across the property",
            icon: Clock3,
            tone: "ink",
            href: "/admin/checkpoints",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.75fr)]">
        <AccessTrendPanel
          analytics={analytics}
          range={range}
          isLoading={analyticsPending}
          isError={analyticsError}
          isFetching={analyticsFetching}
          onRetry={onRetryAnalytics}
        />

        <AttentionQueue
          queue={attention}
          useCase={useCase}
          propertyName={propertyName}
          isLoading={attentionPending}
          isError={attentionError}
          isRetrying={attentionFetching}
          onRetry={onRetryAttention}
        />

        <ReportPanel
          title="Place scope"
          description="Current root Places in this Site workspace."
        >
          {data.root_places.length ? (
            <div className="divide-y divide-[var(--vms-line)]">
              {data.root_places.slice(0, 5).map((place) => (
                <div
                  key={place.id}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] sm:px-5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]">
                    <Building2
                      className="h-4 w-4 text-[var(--vms-ink-muted)]"
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-semibold">
                      {place.name}
                    </strong>
                    <span className="block truncate text-xs text-[var(--vms-ink-muted)]">
                      {humanize(place.kind)} · {humanize(useCase)}
                    </span>
                  </span>
                  <Badge variant={place.is_active ? "success" : "neutral"}>
                    {place.is_active ? "Active" : "Archived"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <PanelState
              kind="empty"
              compact
              title="No properties in scope"
              description="Create the first property to begin operating this organization."
            />
          )}
        </ReportPanel>
      </div>

      <ActivityRegister data={data} propertyName={propertyName} />
    </div>
  );
}

function countDirection(data: AdminDashboard, direction: "entry" | "exit") {
  return data.recent_checkpoint_events.filter(
    (event) => event.direction === direction,
  ).length;
}

function ActivityRegister({
  data,
  propertyName,
}: {
  data: AdminDashboard;
  propertyName: string;
}) {
  const events = data.recent_checkpoint_events.slice(0, 12);

  return (
    <ReportPanel
      title="Recent checkpoint activity"
      description="The latest access decisions and observed movement for this property."
      action={<SeeAllLink href="/admin/checkpoints">Open register</SeeAllLink>}
      footer={`Showing ${events.length} of ${data.recent_checkpoint_events.length} recent checkpoint events.`}
    >
      {events.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">
                Recent checkpoint activity for {propertyName}
              </caption>
              <thead className="bg-[var(--vms-surface-subtle)] text-[11px] uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-semibold">
                    Date and time
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Movement
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Gate
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Result
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-t border-[var(--vms-line)] hover:bg-[var(--vms-surface-subtle)]"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-[var(--vms-ink-muted)]">
                      <time dateTime={event.occurred_at}>
                        {formatDateTime(event.occurred_at)}
                      </time>
                    </td>
                    <td className="px-4 py-3 font-medium capitalize">
                      {movementLabel(event.direction)}
                    </td>
                    <td className="px-4 py-3 text-[var(--vms-ink-muted)]">
                      {event.gate_id}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={outcomeVariant(event.outcome)}>
                        {humanize(event.outcome)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--vms-ink-muted)]">
                      {humanize(event.reason_code)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ol className="divide-y divide-[var(--vms-line)] md:hidden">
            {events.map((event) => (
              <li key={event.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize">
                      {movementLabel(event.direction)}
                    </p>
                    <time
                      dateTime={event.occurred_at}
                      className="mt-1 block text-xs text-[var(--vms-ink-muted)]"
                    >
                      {formatDateTime(event.occurred_at)}
                    </time>
                  </div>
                  <Badge variant={outcomeVariant(event.outcome)}>
                    {humanize(event.outcome)}
                  </Badge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-[var(--vms-ink-muted)]">Gate</dt>
                    <dd className="mt-1 font-medium">{event.gate_id}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--vms-ink-muted)]">Reason</dt>
                    <dd className="mt-1 font-medium">
                      {humanize(event.reason_code)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <PanelState
          kind="empty"
          compact
          title="No checkpoint activity yet"
          description="Entries, exits, and decision outcomes will appear here as people pass through configured checkpoints."
        />
      )}
    </ReportPanel>
  );
}
